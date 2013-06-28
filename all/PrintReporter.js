var jasmine = require("./jasmine");
var diff = require('./diff');

var red = '\u001b[1;41m';
var reset = '\u001b[0m';

function highlightDifferences(a, b) {
  var changes = diff.diffChars(a, b);

  var ret = {a: '', b: ''};
  var change;
  for (var i = 0, il = changes.length; i < il; i++) {
    change = changes[i];
    if (change.added) {
      ret.b += red + change.value + reset;
    } else if (change.removed) {
      ret.a += red + change.value + reset;
    } else {
      ret.a += change.value;
      ret.b += change.value;
    }
  }
  return ret;
}

function PrintReporter(name, root_directory) {
  this.skipCount = 0;
  this.failCount = 0;
  this.expectCount = 0;
  this.specCount = 0;
  this.name = name;
  this.rootDirectory = root_directory;
}
exports.PrintReporter =
jasmine.PrintReporter = PrintReporter;

PrintReporter.prototype = new jasmine.Reporter();
// Set verbose=true on the test instance to enable additional logging
PrintReporter.prototype.verbose = false;
PrintReporter.prototype._didSpecName = false;

PrintReporter.prototype.reportSpecStarting = function(spec) {
  this._didSpecName = false;
  this._spec = spec;
};

PrintReporter.prototype.reportRunnerResults = function(runner) {
  // Don't print out the spec name at the end
  this._didSpecName = true;

  this.log([
    this.specCount + " spec",
    this.expectCount + " expect",
    this.skipCount + " skip",
    this.failCount + " fail"
  ].join("  "));

  require("./phantom").exit(this.failCount);
};


PrintReporter.prototype.reportSuiteResults = function(suite) {
  var results = suite.results();
  if (this.verbose) {
    this.log('Suite "' + suite.description + '": ' +
      results.passedCount + '/' + results.totalCount + ' passed.');
  }

  // If suite is nested, only count the root suite
  if (!suite.parentSuite) {
    this.failCount += results.totalCount - results.passedCount;
    this.expectCount += results.totalCount;
  }
};

PrintReporter.prototype.reportSpecResults = function(spec) {
  if (this.verbose) {
    this.log('it... ' +
      spec.description + ': ' + (spec.results().passed() ? 'pass' : 'fail'));
  }

  var self = this;
  var results = spec.results();

  this.specCount += 1;

  if (results.skipped)
    this.skipCount += 1;

  results.getItems().forEach(function(result) {
    if (result.type == 'log') {
      self.log(result.toString());
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      var ppActual = jasmine.pp(result.actual);
      var ppExpected = jasmine.pp(result.expected);

      var colorDiff = highlightDifferences(ppActual, ppExpected);

      var message = result.message;
      message = message.replace(ppActual, colorDiff.a);
      message = message.replace(ppExpected, colorDiff.b);

      self.log(message);
      if (result.trace.stack) {
        self.log();
        result.trace.stack.split('\n').forEach(function(stackFrame) {
          if (stackFrame.indexOf('/jasmine/lib/jasmine-core') > -1) {
            return;
          }
          if (this.rootDirectory) {
            stackFrame = stackFrame.replace(this.rootDirectory + '/', '');
          }
          self.log('  ' + stackFrame);
        }.bind(this));
      }
    }
  });
};

PrintReporter.prototype.log = function(str) {
  if (!this._didSpecName) {
    console.log('');
    console.log(
      this._spec.suite.description + ': it ' + this._spec.description);
    this._didSpecName = true;
  }
  console.log(str || '');
};
