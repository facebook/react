document.write('<style> @import "../vendor/jasmine/jasmine.css?_=' + (+new Date).toString(36) + '"; </style>');

;(function(env){
  var htmlReporter = new jasmine.HtmlReporter();
  env.addReporter(htmlReporter);
  env.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  // Clean up any nodes the previous test might have added.
  env.afterEach(function() {
    harness.removeNextSiblings(document.body);
    harness.removeNextSiblings(document.getElementById("HTMLReporter"));
  });

  window.onload = function(){
    env.execute();
  }
})(jasmine.getEnv());
