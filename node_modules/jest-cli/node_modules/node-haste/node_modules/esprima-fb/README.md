**Esprima** ([esprima.org](http://esprima.org), BSD license) is a high performance,
standard-compliant [ECMAScript](http://www.ecma-international.org/publications/standards/Ecma-262.htm)
parser written in ECMAScript (also popularly known as
[JavaScript](http://en.wikipedia.org/wiki/JavaScript>JavaScript)).
Esprima is created and maintained by [Ariya Hidayat](http://twitter.com/ariyahidayat),
with the help of [many contributors](https://github.com/ariya/esprima/contributors).

### Features

- Full support for ECMAScript 5.1 ([ECMA-262](http://www.ecma-international.org/publications/standards/Ecma-262.htm))
- Sensible [syntax tree format](http://esprima.org/doc/index.html#ast) compatible with Mozilla
[Parser AST](https://developer.mozilla.org/en/SpiderMonkey/Parser_API)
- Optional tracking of syntax node location (index-based and line-column)
- Heavily tested (> 600 [unit tests](http://esprima.org/test/) with solid statement and branch coverage)
- Experimental support for ES6/Harmony (module, class, destructuring, ...)

Esprima serves as a **building block** for some JavaScript
language tools, from [code instrumentation](http://esprima.org/demo/functiontrace.html)
to [editor autocompletion](http://esprima.org/demo/autocomplete.html).

Esprima runs on many popular web browsers, as well as other ECMAScript platforms such as
[Rhino](http://www.mozilla.org/rhino) and [Node.js](https://npmjs.org/package/esprima).

For more information, check the web site [esprima.org](http://esprima.org).
