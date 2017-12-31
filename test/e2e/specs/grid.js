module.exports = {
  'grid': function (browser) {
    var columns = ['name', 'power']

    browser
    .url('http://localhost:8080/examples/grid/')
      .waitForElementVisible('table', 1000)
      .assert.count('th', 2)
      .assert.count('th.active', 0)
      .assert.containsText('th:nth-child(1)', 'Name')
      .assert.containsText('th:nth-child(2)', 'Power')
      assertTable([
        { name: 'Chuck Norris', power: Infinity },
        { name: 'Bruce Lee', power: 9000 },
        { name: 'Jackie Chan', power: 7000 },
        { name: 'Jet Li', power: 8000 }
      ])

    browser
      .click('th:nth-child(1)')
      .assert.count('th.active:nth-child(1)', 1)
      .assert.count('th.active:nth-child(2)', 0)
      .assert.count('th:nth-child(1) .arrow.dsc', 1)
      .assert.count('th:nth-child(2) .arrow.dsc', 0)
      assertTable([
        { name: 'Jet Li', power: 8000 },
        { name: 'Jackie Chan', power: 7000 },
        { name: 'Chuck Norris', power: Infinity },
        { name: 'Bruce Lee', power: 9000 }
      ])

    browser
      .click('th:nth-child(2)')
      .assert.count('th.active:nth-child(1)', 0)
      .assert.count('th.active:nth-child(2)', 1)
      .assert.count('th:nth-child(1) .arrow.dsc', 1)
      .assert.count('th:nth-child(2) .arrow.dsc', 1)
      assertTable([
        { name: 'Chuck Norris', power: Infinity },
        { name: 'Bruce Lee', power: 9000 },
        { name: 'Jet Li', power: 8000 },
        { name: 'Jackie Chan', power: 7000 }
      ])

    browser
      .click('th:nth-child(2)')
      .assert.count('th.active:nth-child(1)', 0)
      .assert.count('th.active:nth-child(2)', 1)
      .assert.count('th:nth-child(1) .arrow.dsc', 1)
      .assert.count('th:nth-child(2) .arrow.asc', 1)
      assertTable([
        { name: 'Jackie Chan', power: 7000 },
        { name: 'Jet Li', power: 8000 },
        { name: 'Bruce Lee', power: 9000 },
        { name: 'Chuck Norris', power: Infinity }
      ])

    browser
      .click('th:nth-child(1)')
      .assert.count('th.active:nth-child(1)', 1)
      .assert.count('th.active:nth-child(2)', 0)
      .assert.count('th:nth-child(1) .arrow.asc', 1)
      .assert.count('th:nth-child(2) .arrow.asc', 1)
      assertTable([
        { name: 'Bruce Lee', power: 9000 },
        { name: 'Chuck Norris', power: Infinity },
        { name: 'Jackie Chan', power: 7000 },
        { name: 'Jet Li', power: 8000 }
      ])

    browser
      .setValue('input[name="query"]', 'j')
      assertTable([
        { name: 'Jackie Chan', power: 7000 },
        { name: 'Jet Li', power: 8000 }
      ])

    browser
      .clearValue('input[name="query"]')
      .setValue('input[name="query"]', 'infinity')
      assertTable([
        { name: 'Chuck Norris', power: Infinity }
      ])

    browser
      .clearValue('input[name="query"]')
      .assert.count('p', 0)
      .setValue('input[name="query"]', 'stringthatdoesnotexistanywhere')
      .assert.count('p', 1)

    browser.end()

    function assertTable (data) {
      browser.assert.count('td', data.length * columns.length)
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < columns.length; j++) {
          browser.assert.containsText(
            'tr:nth-child(' + (i + 1) + ') td:nth-child(' + (j + 1) + ')',
            data[i][columns[j]]
          )
        }
      }
    }
  }
}
