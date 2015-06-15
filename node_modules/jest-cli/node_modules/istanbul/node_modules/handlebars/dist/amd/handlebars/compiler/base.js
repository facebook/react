define(
  ["./parser","./ast","./whitespace-control","./helpers","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var parser = __dependency1__["default"];
    var AST = __dependency2__["default"];
    var WhitespaceControl = __dependency3__["default"];
    var Helpers = __dependency4__;
    var extend = __dependency5__.extend;

    __exports__.parser = parser;

    var yy = {};
    extend(yy, Helpers, AST);

    function parse(input, options) {
      // Just return if an already-compiled AST was passed in.
      if (input.type === 'Program') { return input; }

      parser.yy = yy;

      // Altering the shared object here, but this is ok as parser is a sync operation
      yy.locInfo = function(locInfo) {
        return new yy.SourceLocation(options && options.srcName, locInfo);
      };

      var strip = new WhitespaceControl();
      return strip.accept(parser.parse(input));
    }

    __exports__.parse = parse;
  });