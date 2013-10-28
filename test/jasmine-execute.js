;(function(env){
  env.addReporter(new TAPReporter(console.log.bind(console)));
  
  // Clean up any nodes the previous test might have added.
  env.afterEach(function() {
    harness.removeNextSiblings(document.body);
    harness.removeNextSiblings(document.getElementById("HTMLReporter"));
  });

  window.onload = function(){
    env.execute();
  }
})(jasmine.getEnv());
