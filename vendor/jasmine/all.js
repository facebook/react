require("./phantom");
require("./console");

// TODO Also bundle jasmine.css here.
var jasmine = require("./jasmine");
require("./jasmine-html");
require("./jasmine-support");

require("./HtmlReporter");
require("./PrintReporter");
require("./ReporterView");
require("./SpecView");
require("./SuiteView");

var env = jasmine.getEnv();
env.addReporter(new jasmine.HtmlReporter);
env.addReporter(new jasmine.PrintReporter);

function exposeFrom(obj) {
  obj.spyOn = jasmine.spyOn;
  obj.it = jasmine.it;
  obj.xit = jasmine.xit;
  obj.expect = jasmine.expect;
  obj.runs = jasmine.runs;
  obj.waits = jasmine.waits;
  obj.waitsFor = jasmine.waitsFor;
  obj.beforeEach = jasmine.beforeEach;
  obj.afterEach = jasmine.afterEach;
  obj.describe = jasmine.describe;
  obj.xdescribe = jasmine.xdescribe;
  obj.jasmine = jasmine;
  return obj;
}
jasmine.exposeFrom = exposeFrom;
var global = Function("return this")();
exposeFrom(global);

module.exports = jasmine;
