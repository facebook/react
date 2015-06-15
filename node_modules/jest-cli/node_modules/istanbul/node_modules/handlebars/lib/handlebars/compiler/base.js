import parser from "./parser";
import AST from "./ast";
import WhitespaceControl from "./whitespace-control";
module Helpers from "./helpers";
import { extend } from "../utils";

export { parser };

var yy = {};
extend(yy, Helpers, AST);

export function parse(input, options) {
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
