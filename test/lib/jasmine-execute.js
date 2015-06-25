document.write('<style> @import \'../vendor/jasmine/jasmine.css?_=' + (+new Date()).toString(36) + '\'; </style>');

(function(env) {
  var htmlReporter = new jasmine.HtmlReporter();
  env.addReporter(htmlReporter);
  env.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  // Clean up any nodes the previous test might have added.
  env.afterEach(function() {
    harness.removeNextSiblings(document.body);
    harness.removeNextSiblings(document.getElementById('HTMLReporter'));
  });

  window.onload = function() {
    env.execute();
  };

  var oldError = console.error;
  var newError = function() {
    oldError.apply(this, arguments);
    var spec = env.currentSpec;
    if (spec) {
      var expectationResult = new jasmine.ExpectationResult({
        passed: false,
        message:
          'Expected test not to warn. If the warning is expected, mock it ' +
          'out using spyOn(console, \'error\'); and test that the warning ' +
          'occurs.',
      });
      spec.addMatcherResult(expectationResult);
    }
  };
  console.error = newError;
  // Make sure console.error is set back at the end of each test, or else the
  // above logic won't work
  env.afterEach(function() {
    if (console.error !== newError && !console.error.isSpy) {
      var expectationResult = new jasmine.ExpectationResult({
        passed: false,
        message: 'Test did not tear down console.error mock properly.',
      });
      env.currentSpec.addMatcherResult(expectationResult);
    }
  });
})(jasmine.getEnv());
