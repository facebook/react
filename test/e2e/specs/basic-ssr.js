module.exports = {
  'basic SSR': function (browser) {
    browser
    .url('http://localhost:8080/test/e2e/specs/basic-ssr.html')
      .assert.containsText('#result', '<div data-server-rendered="true">foo</div>')
      .end()
  }
}
