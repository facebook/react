/* globals stats, valueToPoint */
module.exports = {
  'svg': function (browser) {
    browser
    .url('http://localhost:8080/examples/svg/')
      .waitForElementVisible('svg', 1000)
      .assert.count('g', 1)
      .assert.count('polygon', 1)
      .assert.count('circle', 1)
      .assert.count('text', 6)
      .assert.count('label', 6)
      .assert.count('button', 7)
      .assert.count('input[type="range"]', 6)
      .assert.evaluate(function () {
        var points = stats.map(function (stat, i) {
        var point = valueToPoint(stat.value, i, 6)
          return point.x + ',' + point.y
        }).join(' ')
        return document.querySelector('polygon').attributes[0].value === points
      })
      .click('button.remove')
      .assert.count('text', 5)
      .assert.count('label', 5)
      .assert.count('button', 6)
      .assert.count('input[type="range"]', 5)
      .assert.evaluate(function () {
        var points = stats.map(function (stat, i) {
        var point = valueToPoint(stat.value, i, 5)
          return point.x + ',' + point.y
        }).join(' ')
        return document.querySelector('polygon').attributes[0].value === points
      })
      .setValue('input[name="newlabel"]', 'foo')
      .click('#add > button')
      .assert.count('text', 6)
      .assert.count('label', 6)
      .assert.count('button', 7)
      .assert.count('input[type="range"]', 6)
      .assert.evaluate(function () {
        var points = stats.map(function (stat, i) {
        var point = valueToPoint(stat.value, i, 6)
          return point.x + ',' + point.y
        }).join(' ')
        return document.querySelector('polygon').attributes[0].value === points
      })
      .end()
  }
}
