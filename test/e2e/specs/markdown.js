module.exports = {
  'markdown': function (browser) {
    browser
    .url('http://localhost:8080/examples/markdown/')
      .waitForElementVisible('#editor', 1000)
      .assert.value('textarea', '# hello')
      .assert.hasHTML('#editor div', '<h1 id="hello">hello</h1>')
      .setValue('textarea', '\n## foo\n\n- bar\n- baz')
      // assert the output is not updated yet because of debounce
      .assert.hasHTML('#editor div', '<h1 id="hello">hello</h1>')
      .waitFor(500)
      .assert.hasHTML('#editor div',
        '<h1 id="hello">hello</h1>\n' +
        '<h2 id="foo">foo</h2>\n' +
        '<ul>\n<li>bar</li>\n<li>baz</li>\n</ul>'
      )
      .end()
  }
}
