document.write('<style> @import "../vendor/jasmine/jasmine.css?_=' + (+new Date).toString(36) + '"; </style>');

;(function(env){
  env.addReporter(new jasmine.HtmlReporter);
  // Clean up any nodes the previous test might have added.
  env.afterEach(function() {
    harness.removeNextSiblings(document.body);
    harness.removeNextSiblings(document.getElementById("HTMLReporter"));
  });

  window.onload = function(){
    env.execute();
  }
})(jasmine.getEnv());
