exports.local = {
  webdriver: {
    remote: {
      protocol: 'http:',
      hostname: '127.0.0.1',
      port: '9515',
      path: '/'
    }
  },
  browser:{browserName:'chrome'},
  url: "http://127.0.0.1:9999/test/sauce-harness.html",
  onComplete: function(report){
    var browser = this;
    console.log('report.passed', report.passed)
  }
}
