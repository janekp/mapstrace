# Mapstrace

A really simple library for printing human-readable stack-traces
for combined, minified and/or compiled javascript files.

It assumes that your javascript file(s) have [source maps](http://wiki.mozilla.org/DevTools/Features/SourceMap) (index.js -> index.js.map etc).

For example the following stack-trace:

    TypeError: Cannot read property 'length' of null
        at $extend.index (/Users/janekp/Documents/wixe/trunk/server/api/web/index.js:103:7)
        at Application.main.wixe1.route.ctx.template (/Users/janekp/Documents/wixe/trunk/server/api/web/index.js:12:24)
        at Object.wixe.Server.handle (/Users/janekp/Documents/wixe/trunk/server/api/web/index.js:253:5)
        at Object.handle (/Users/janekp/Documents/wixe/trunk/server/api/web/index.js:197:8)
        at next (/Users/janekp/Documents/wixe/trunk/server/api/web/node_modules/connect/lib/proto.js:190:15)
        at Function.app.handle (/Users/janekp/Documents/wixe/trunk/server/api/web/node_modules/connect/lib/proto.js:198:3)
        at Server.app (/Users/janekp/Documents/wixe/trunk/server/api/web/node_modules/connect/lib/connect.js:66:31)
        at Server.EventEmitter.emit (events.js:91:17)
        at HTTPParser.parser.onIncoming (http.js:1785:12)
        at HTTPParser.parserOnHeadersComplete [as onHeadersComplete] (http.js:111:23)

becomes developer-friendly:

    TypeError: Cannot read property 'length' of null:
        at 'if(x.length == 0) {' (.../trunk/server/api/src/RecipesPage.hx:45:25)
        at 'wixe.get('/:action/:id{0-9}', RecipesPage)' (.../trunk/server/api/src/Application.hx:15:7)
        at 'handler(ctx)' (.../server/api/src/wixe/Server.hx:290:23)
        at 'this.handle(req, res, next)' (.../server/api/src/wixe/Server.hx:306:37)
        ... (omitted 6 rows)

# Installation and Dependencies

Install node.js for your platform

    npm install mapstrace

It can be used with or without [Connect](http://github.com/senchalabs/connect)

    var mapstrace = require('mapstrace');
    
    // Connect
    var connect = require('connect');
    connect.createServer().use(connect.static('public')).use(mapstrace()).listen(3000);
    
    // Stand-alone
    mapstrace.build(err, true, function(result) {
        console.log(err.toString() + ':\n' + mapstrace.stringify(result));
    });

The library can also be used to manually build a list of items and convert them into a string.

    // err  - javascript Error object
    // full - if true, then it will parse source files to fill missing fields.
    // fn   - asynchronous callback that returns a list of items.
    //        The list can contain objects and integers. Integers are used for unknown external items.
    //        Every item has lineNumber, columnNumber, source and name fields.
    mapstrace.build(err : Error, full : Bool, fn : Array -> Void) : Void;

    // items  - A list of stack items (either numbers or objects).
    // prefix - If not null then prefix is removed from paths. Optional, default is null
    // limit  - The max number of path components. Optional, default is 5
    // Returns a string.
    mapstrace.stringify(items : Array, prefix : String, limit : Int) : String;

