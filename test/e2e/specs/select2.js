/* globals vm */
module.exports = {
  'select2': function (browser) {
    browser
    .url('http://localhost:8080/examples/select2/')
      .waitForElementVisible('.select2', 1000)
      .assert.elementPresent('select')
      .assert.containsText('p', 'Selected: 0')
      .assert.containsText('span.select2', 'Select one')

      .click('.select2-selection__rendered')
      .assert.count('.select2-results__option', 3)
      .assert.containsText('.select2-results__option:nth-child(1)', 'Select one')
      .assert.containsText('.select2-results__option:nth-child(2)', 'Hello')
      .assert.containsText('.select2-results__option:nth-child(3)', 'World')
      .assert.attributePresent('.select2-results__option:nth-child(1)', 'aria-disabled')

      .click('.select2-results__option:nth-child(2)')
      .assert.count('.select2-results__option', 0)
      .assert.containsText('p', 'Selected: 1')
      .assert.containsText('span.select2', 'Hello')

      // test dynamic options
      .execute(function () {
        vm.options.push({ id: 3, text: 'Vue' })
      })
      .click('.select2-selection__rendered')
      .assert.count('.select2-results__option', 4)
      .assert.containsText('.select2-results__option:nth-child(1)', 'Select one')
      .assert.containsText('.select2-results__option:nth-child(2)', 'Hello')
      .assert.containsText('.select2-results__option:nth-child(3)', 'World')
      .assert.containsText('.select2-results__option:nth-child(4)', 'Vue')

      .click('.select2-results__option:nth-child(4)')
      .assert.count('.select2-results__option', 0)
      .assert.containsText('p', 'Selected: 3')
      .assert.containsText('span.select2', 'Vue')

      .execute(function () {
        vm.selected = 2
      })
      .assert.containsText('p', 'Selected: 2')
      .assert.containsText('span.select2', 'World')
      .end()
  }
}
