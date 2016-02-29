'use strict';

var env = jasmine.getEnv();

var callCount = 0;
var oldError = console.error;
var newError = function() {
  callCount++;
  oldError.apply(this, arguments);
};

console.error = newError;

env.beforeEach(() => {
  callCount = 0;
  jasmine.addMatchers({
    toBeReset() {
      return {
        compare(actual) {
          // TODO: Catch test cases that call spyOn() but don't inspect the mock
          // properly.
          if (actual !== newError && !jasmine.isSpy(actual)) {
            return {
              pass: false,
              message: 'Test did not tear down console.error mock properly.',
            };
          }
          return {pass: true};
        },
      };
    },
    toNotHaveBeenCalled() {
      return {
        compare(actual) {
          return {
            pass: callCount === 0,
            message:
              'Expected test not to warn. If the warning is expected, mock ' +
              'it out using spyOn(console, \'error\'); and test that the ' +
              'warning occurs.',
          };
        },
      };
    },
  });
});
env.afterEach(() => {
  expect(console.error).toBeReset();
  expect(console.error).toNotHaveBeenCalled();
});


// MetaMatchers

class MetaMatcherReporter {
  constructor() {
    this._testResults = [];
    this._currentSuites = [];
  }

  specDone(result) {
    this._testResults.push(
      this._extractSpecResults(result, this._currentSuites.slice(0))
    );
  }

  suiteStarted(suite) {
    this._currentSuites.push(suite.description);
  }

  suiteDone() {
    this._currentSuites.pop();
  }

  getResults() {
    return this._testResults;
  }

  _extractSpecResults(specResult, currentSuites) {
    const results = {
      title: 'it ' + specResult.description,
      ancestorTitles: currentSuites,
      failureMessages: [],
      numPassingAsserts: 0, // Jasmine2 only returns an array of failed asserts.
    };

    // specResult.failedExpectations.forEach(failed => {
    //   let message;
    //   if (!failed.matcherName) {
    //     message = this._formatter.formatException(failed.stack);
    //   } else {
    //     message = this._formatter.formatMatchFailure(failed);
    //   }
    //   results.failureMessages.push(message);
    // });
    results.failedExpectations = specResult.failedExpectations;

    return results;
  }

  getResultsSummary() {
    let numFailingTests = 0;
    let numPassingTests = 0;
    const testResults = this._testResults;
    testResults.forEach(testResult => {
      if (testResult.failureMessages.length > 0) {
        numFailingTests++;
      } else {
        numPassingTests++;
      }
    });
    return {
      numTests: numFailingTests + numPassingTests,
      numFailingTests,
      numPassingTests,
      testResults,
    };
  }
}

function getRunnerWithResults(describeFunction) {
  if (describeFunction._cachedRunner) {
    // Cached result of execution. This is a convenience way to test against
    // the same authoritative function multiple times.
    return describeFunction._cachedRunner;
  }

  var myEnv = new jasmine.Env();

  var matcherReporter = new MetaMatcherReporter();
  myEnv.addReporter(matcherReporter);

  myEnv.describe('', describeFunction);
  myEnv.execute();
  console.error('f');
  var results = matcherReporter.getResultsSummary();
  // console.error(results);
  console.error(describeFunction.toString());

  describeFunction._cachedRunner = results;
  return results;
}

function compareSpec(actual, expected) {
  if (actual.numTests !== expected.numTests) {
    return (
      'Expected ' + expected.numTests + ' expects, ' +
      'but got ' + actual.numTests + ':' +
      actual.title
    );
  }
  return null;
}

function includesDescription(specs, description, startIndex) {
  for (var i = startIndex; i < specs.length; i++) {
    if (specs[i].title === description) {
      return true;
    }
  }
  return false;
}

function compareSpecs(actualSpecs, expectedSpecs) {
  for (var i = 0; i < actualSpecs.length && i < expectedSpecs.length; i++) {
    var actual = actualSpecs[i];
    var expected = expectedSpecs[i];
    if (actual.title === expected.title) {
      var errorMessage = compareSpec(actual, expected);
      if (errorMessage) {
        return errorMessage;
      }
      continue;
    } else if (includesDescription(actualSpecs, expected.title, i)) {
      return 'Did not expect the spec:' + actualSpecs[i].title;
    } else {
      return 'Expected an equivalent to:' + expectedSpecs[i].gtitle;
    }
  }
  if (i < actualSpecs.length) {
    return 'Did not expect the spec:' + actualSpecs[i].title;
  }
  if (i < expectedSpecs.length) {
    return 'Expected an equivalent to:' + expectedSpecs[i].title;
  }
  return null;
}

function compareDescription(a, b) {
  if (a.title === b.title) {
    return 0;
  }
  return a.title < b.title ? -1 : 1;
}

function compareRunners(actual, expected) {
  return compareSpecs(
    actual.testResults.sort(compareDescription),
    expected.testResults.sort(compareDescription)
  );
}

// env.addReporter();

env.beforeEach(() => {
  jasmine.addMatchers({
    toEqualSpecsIn(/* util, customEqualityMatcher*/) {
      return {
        compare(actualDescribeFunction, expectedDescribeFunction) {
          if (typeof actualDescribeFunction !== 'function') {
            throw Error('toEqualSpecsIn() should be used on a describe function');
          }
          if (typeof expectedDescribeFunction !== 'function') {
            throw Error('toEqualSpecsIn() should be passed a describe function');
          }
          var actual = getRunnerWithResults(actualDescribeFunction);
          var expected = getRunnerWithResults(expectedDescribeFunction);
          var errorMessage = compareRunners(actual, expected);
          // var errorMessage = null;

          console.error(actual);
          console.error(expected);
          console.error('----')

          if (errorMessage) {
            return {
              pass: false,
              message: errorMessage + 'The specs are equal. Expected them to be different.',
            }
          };

          return {
            pass: true,
          };
        },
      };
    },
  });
});
