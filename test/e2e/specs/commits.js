module.exports = {
  'commits': function (browser) {
    browser
    .url('http://localhost:8080/examples/commits/')
      .waitForElementVisible('li', 5000)
      .assert.count('input', 2)
      .assert.count('label', 2)
      .assert.containsText('label[for="master"]', 'master')
      .assert.containsText('label[for="dev"]', 'dev')
      .assert.checked('#master')
      .assert.checked('#dev', false)
      .assert.containsText('p', 'vuejs/vue@master')
      .assert.count('li', 3)
      .assert.count('li .commit', 3)
      .assert.count('li .message', 3)
      .click('#dev')
      .assert.containsText('p', 'vuejs/vue@dev')
      .assert.count('li', 3)
      .assert.count('li .commit', 3)
      .assert.count('li .message', 3)
      .end()
  }
}
