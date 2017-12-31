module.exports = {
  'modal': function (browser) {
    browser
    .url('http://localhost:8080/examples/modal/')
      .waitForElementVisible('#app', 1000)
      .assert.elementNotPresent('.modal-mask')
      .click('#show-modal')
      .assert.elementPresent('.modal-mask')
      .assert.elementPresent('.modal-wrapper')
      .assert.elementPresent('.modal-container')
      .waitFor(50)
      .assert.cssClassPresent('.modal-mask', 'modal-enter-active')
      .waitFor(300)
      .assert.cssClassNotPresent('.modal-mask', 'modal-enter-active')
      .assert.containsText('.modal-header h3', 'custom header')
      .assert.containsText('.modal-body', 'default body')
      .assert.containsText('.modal-footer', 'default footer')
      .click('.modal-default-button')
      // should have transition
      .assert.elementPresent('.modal-mask')
      .waitFor(50)
      .assert.cssClassPresent('.modal-mask', 'modal-leave-active')
      .waitFor(300)
      .assert.elementNotPresent('.modal-mask')
      .end()
  }
}
