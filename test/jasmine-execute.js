;(function(env){
  // Clean up any nodes the previous test might have added.
  env.afterEach(function() {
    harness.removeNextSiblings(document.body);
    harness.removeNextSiblings(document.getElementById("HTMLReporter"));
  });

  window.onload = function(){
    env.execute();
  }
})(jasmine.getEnv());
