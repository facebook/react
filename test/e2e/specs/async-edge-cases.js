module.exports = {
  'async edge cases': function (browser) {
    browser
    .url('http://localhost:8080/test/e2e/specs/async-edge-cases.html')
      // #4510
      .assert.containsText('#case-1', '1')
      .assert.checked('#case-1 input', false)

      .click('#case-1 input')
      .assert.containsText('#case-1', '2')
      .assert.checked('#case-1 input', true)

      .click('#case-1 input')
      .assert.containsText('#case-1', '3')
      .assert.checked('#case-1 input', false)

      // #6566
      .assert.containsText('#case-2 button', 'Expand is True')
      .assert.containsText('.count-a', 'countA: 0')
      .assert.containsText('.count-b', 'countB: 0')

      .click('#case-2 button')
      .assert.containsText('#case-2 button', 'Expand is False')
      .assert.containsText('.count-a', 'countA: 1')
      .assert.containsText('.count-b', 'countB: 0')

      .click('#case-2 button')
      .assert.containsText('#case-2 button', 'Expand is True')
      .assert.containsText('.count-a', 'countA: 1')
      .assert.containsText('.count-b', 'countB: 1')

      .end()
  }
}
