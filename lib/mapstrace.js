
var fs = require("fs");
var path = require("path");
var sourceMap = require("source-map");
var stackTrace = require("stack-trace");

function build(err, full, fn) {
    var trace = stackTrace.parse(err);
    var result = [ ];
    var files = { };
    var i, c, t, f;
    var src = { };
    
    function _build() {
        var unk = false;
        var r = 0;
        
        for(i = 0, c = trace.length; i < c; i++) {
            t = trace[i];
            
            if(files[t.fileName].map) {
                t = files[t.fileName].map.originalPositionFor({ line: t.lineNumber, column: t.columnNumber });
                result.push(t);
                
                unk = false;
                
                if(full && t.source && !t.name && !src[t.source]) {
                    src[t.source] = { };
                    r += 1;
                }
            } else if(!unk) {
                result.push(1);
                unk = true;
            } else {
                result[result.length - 1] = result[result.length - 1] + 1;
            }
        }
        
        if(r > 0) {
            i = 0;
            
            for(f in src) {
                if(src.hasOwnProperty(f)) {
                    _readSrc(f);
                }
            }
        } else {
            fn(result);
        }
    }
    
    function _buildNames() {
        var s;
        
        for(i = 0, c = result.length; i < c; i++) {
            t = result[i];
            
            if(typeof(t) !== 'number') {
                if(!t.name && t.source) {
                    s = src[t.source];
                    
                    if(s && s.lines && t.line >= 1 && t.line <= s.lines.length) {
                        t.name = "'" + s.lines[t.line - 1].replace(/^\s\s*/, '').replace(/[;\s]\s*$/, '') + "'";
                        
                        if(t.name.indexOf("'//") === 0) {
                            t.line += 1;
                            t.name = null;
                            i -= 1;
                        }
                    }
                }
            }
        }
        
        fn(result);
    }
    
    function _readSrc(f) {
        i++;
        
        fs.readFile(f, function(err, data) {
            if(!err) {
                src[f].lines = data.toString().split("\n");
            }
            
            i--;
            
            if(i === 0) {
                _buildNames();
            }
        });
    }
    
    function _readMap(f) {
        i++;
        
        fs.stat(f + '.map', function(err, stats) {
            if(!err && stats && stats.isFile()) {
                fs.readFile(f + '.map', function(err, data) {
                    if(!err) {
                        try {
                            files[f].map = new sourceMap.SourceMapConsumer(data.toString());
                        }
                        catch(e) {
                            console.log('Could not parse "' + f + '.map" -- ' + e);
                        }
                    }
                    
                    i--;
                    
                    if(i === 0) {
                        _build();
                    }
                });
            } else {
                i--;
            }
            
            if(i === 0) {
                _build();
            }
        });
    }
    
    if(typeof(full) === 'function') {
        fn = full;
        full = false;
    }
    
    for(i = 0, c = trace.length; i < c; i++) {
        t = trace[i];
        
        if(!files[t.fileName]) {
            files[t.fileName] = { };
        }
    }
    
    i = 0;
    
    for(f in files) {
        if(files.hasOwnProperty(f) &&
            f !== 'module.js' && f !== 'node.js' && f !== 'http.js' && f !== 'events.js') {
            _readMap(f);
        }
    }
    
    if(i === 0) {
        fn(null);
    }
}

function stringify(data, prefix, limit) {
    var result = '';
    var i, c, t;
    
    if(prefix && prefix.length > 0 && prefix.charAt(prefix.length - 1) != path.sep) {
        prefix += path.sep;
    }
    
    if(!limit) {
        // /a/b/c/d/e/f/g -> .../c/d/e/f/g
        limit = 5;
    }
    
    if(data && data.length > 0) {
        for(i = 0, c = data.length; i < c; i++) {
            t = data[i];
            
            if(typeof(t) === 'number') {
                result += (t > 1) ? '    ... (omitted ' + t + ' rows)' : '    ...';
            } else if(t.source === null) {
                result += '???';
            } else {
                if(prefix && t.source.indexOf(prefix) === 0) {
                    t.source = t.source.substr(prefix.length);
                } else {
                    t.parts = t.source.split(path.sep);
                    
                    if(t.parts.length > limit) {
                        t.source = '...' + path.sep + t.parts.slice(t.parts.length - limit).join(path.sep);
                    }
                }
                
                result += "    at " + ((t.name !== null) ? t.name : '???') + ' (' + t.source + ':' + t.line + ':' + t.column + ')';
            }
            
            result += "\n";
        }
    }
    
    return result;
}

module.exports = function(options) {
    return function(err, req, res, next) {
        build(err, true, function(result) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end(err.toString() + ':\n' + stringify(result) + '\n(raw stack-trace)\n\n' + err.stack);
        });
    };
}

module.exports.build = build;
module.exports.stringify = stringify;
