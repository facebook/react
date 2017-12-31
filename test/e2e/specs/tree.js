module.exports = {
  'tree': function (browser) {
    browser
    .url('http://localhost:8080/examples/tree/')
      .waitForElementVisible('li', 1000)
      .assert.count('.item', 12)
      .assert.count('.add', 4)
      .assert.count('.item > ul', 4)
      .assert.notVisible('#demo li ul')
      .assert.containsText('#demo li div span', '[+]')

      // expand root
      .click('.bold')
      .assert.visible('#demo ul')
      .assert.evaluate(function () {
        return document.querySelector('#demo li ul').children.length === 4
      })
      .assert.containsText('#demo li div span', '[-]')
      .assert.containsText('#demo > .item > ul > .item:nth-child(1)', 'hello')
      .assert.containsText('#demo > .item > ul > .item:nth-child(2)', 'wat')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', 'child folder')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', '[+]')

      // add items to root
      .click('#demo > .item > ul > .add')
      .assert.evaluate(function () {
        return document.querySelector('#demo li ul').children.length === 5
      })
      .assert.containsText('#demo > .item > ul > .item:nth-child(1)', 'hello')
      .assert.containsText('#demo > .item > ul > .item:nth-child(2)', 'wat')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', 'child folder')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', '[+]')
      .assert.containsText('#demo > .item > ul > .item:nth-child(4)', 'new stuff')

      // add another item
      .click('#demo > .item > ul > .add')
      .assert.evaluate(function () {
        return document.querySelector('#demo li ul').children.length === 6
      })
      .assert.containsText('#demo > .item > ul > .item:nth-child(1)', 'hello')
      .assert.containsText('#demo > .item > ul > .item:nth-child(2)', 'wat')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', 'child folder')
      .assert.containsText('#demo > .item > ul > .item:nth-child(3)', '[+]')
      .assert.containsText('#demo > .item > ul > .item:nth-child(4)', 'new stuff')
      .assert.containsText('#demo > .item > ul > .item:nth-child(5)', 'new stuff')

      .click('#demo ul .bold')
      .assert.visible('#demo ul ul')
      .assert.containsText('#demo ul > .item:nth-child(3)', '[-]')
      .assert.evaluate(function () {
        return document.querySelector('#demo ul ul').children.length === 5
      })

      .click('.bold')
      .assert.notVisible('#demo ul')
      .assert.containsText('#demo li div span', '[+]')
      .click('.bold')
      .assert.visible('#demo ul')
      .assert.containsText('#demo li div span', '[-]')

      .dblClick('#demo ul > .item div')
      .assert.count('.item', 15)
      .assert.count('.item > ul', 5)
      .assert.containsText('#demo ul > .item:nth-child(1)', '[-]')
      .assert.evaluate(function () {
        var firstItem = document.querySelector('#demo ul > .item:nth-child(1)')
        var ul = firstItem.querySelector('ul')
        return ul.children.length === 2
      })
      .end()
  }
}
