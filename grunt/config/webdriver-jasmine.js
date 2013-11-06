var grunt = require('grunt');


exports.local = {
  webdriver: {
    remote: { protocol: 'http:', hostname: '127.0.0.1', port: 9515, path: '/' }
  },
  url: "http://127.0.0.1:9999/test/index.html",
  onComplete: function(report){
    var browser = this;
    if (!report.passed){
      grunt.fatal("tests failed");
    }
  },
  onError: function(error){
    grunt.fatal(error);
  }
}
