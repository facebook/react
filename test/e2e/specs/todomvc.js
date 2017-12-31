module.exports = {
  'todomvc': function (browser) {
    browser
    .url('http://localhost:8080/examples/todomvc/#test')
      .waitForElementVisible('.todoapp', 1000)
      .assert.notVisible('.main')
      .assert.notVisible('.footer')
      .assert.count('.filters .selected', 1)
      .assert.evaluate(function () {
        return document.querySelector('.filters .selected').textContent === 'All'
      })

    createNewItem('test')
      .assert.count('.todo', 1)
      .assert.notVisible('.todo .edit')
      .assert.containsText('.todo label', 'test')
      .assert.containsText('.todo-count strong', '1')
      .assert.checked('.todo .toggle', false)
      .assert.visible('.main')
      .assert.visible('.footer')
      .assert.notVisible('.clear-completed')
      .assert.value('.new-todo', '')

    createNewItem('test2')
      .assert.count('.todo', 2)
      .assert.containsText('.todo:nth-child(2) label', 'test2')
      .assert.containsText('.todo-count strong', '2')

    // toggle
    browser
      .click('.todo .toggle')
      .assert.count('.todo.completed', 1)
      .assert.cssClassPresent('.todo:nth-child(1)', 'completed')
      .assert.containsText('.todo-count strong', '1')
      .assert.visible('.clear-completed')

    createNewItem('test3')
      .assert.count('.todo', 3)
      .assert.containsText('.todo:nth-child(3) label', 'test3')
      .assert.containsText('.todo-count strong', '2')

    createNewItem('test4')
    createNewItem('test5')
      .assert.count('.todo', 5)
      .assert.containsText('.todo-count strong', '4')

    // toggle more
    browser
      .click('.todo:nth-child(4) .toggle')
      .click('.todo:nth-child(5) .toggle')
      .assert.count('.todo.completed', 3)
      .assert.containsText('.todo-count strong', '2')

    // remove
    removeItemAt(1)
      .assert.count('.todo', 4)
      .assert.count('.todo.completed', 2)
      .assert.containsText('.todo-count strong', '2')
    removeItemAt(2)
      .assert.count('.todo', 3)
      .assert.count('.todo.completed', 2)
      .assert.containsText('.todo-count strong', '1')

    // remove all
    browser
      .click('.clear-completed')
      .assert.count('.todo', 1)
      .assert.containsText('.todo label', 'test2')
      .assert.count('.todo.completed', 0)
      .assert.containsText('.todo-count strong', '1')
      .assert.notVisible('.clear-completed')

    // prepare to test filters
    createNewItem('test')
    createNewItem('test')
      .click('.todo:nth-child(2) .toggle')
      .click('.todo:nth-child(3) .toggle')

    // active filter
    browser
      .click('.filters li:nth-child(2) a')
      .assert.count('.todo', 1)
      .assert.count('.todo.completed', 0)
      // add item with filter active
      createNewItem('test')
      .assert.count('.todo', 2)

    // completed filter
    browser.click('.filters li:nth-child(3) a')
      .assert.count('.todo', 2)
      .assert.count('.todo.completed', 2)

    // filter on page load
    browser.url('http://localhost:8080/examples/todomvc/#active')
      .assert.count('.todo', 2)
      .assert.count('.todo.completed', 0)
      .assert.containsText('.todo-count strong', '2')

    // completed on page load
    browser.url('http://localhost:8080/examples/todomvc/#completed')
      .assert.count('.todo', 2)
      .assert.count('.todo.completed', 2)
      .assert.containsText('.todo-count strong', '2')

    // toggling with filter active
    browser
      .click('.todo .toggle')
      .assert.count('.todo', 1)
      .click('.filters li:nth-child(2) a')
      .assert.count('.todo', 3)
      .click('.todo .toggle')
      .assert.count('.todo', 2)

    // editing triggered by blur
    browser
      .click('.filters li:nth-child(1) a')
      .dblClick('.todo:nth-child(1) label')
      .assert.count('.todo.editing', 1)
      .assert.focused('.todo:nth-child(1) .edit')
      .clearValue('.todo:nth-child(1) .edit')
      .setValue('.todo:nth-child(1) .edit', 'edited!')
      .click('footer') // blur
      .assert.count('.todo.editing', 0)
      .assert.containsText('.todo:nth-child(1) label', 'edited!')

    // editing triggered by enter
    browser
      .dblClick('.todo label')
      .enterValue('.todo:nth-child(1) .edit', 'edited again!')
      .assert.count('.todo.editing', 0)
      .assert.containsText('.todo:nth-child(1) label', 'edited again!')

    // cancel
    browser
      .dblClick('.todo label')
      .clearValue('.todo:nth-child(1) .edit')
      .setValue('.todo:nth-child(1) .edit', 'edited!')
      .trigger('.todo:nth-child(1) .edit', 'keyup', 27)
      .assert.count('.todo.editing', 0)
      .assert.containsText('.todo:nth-child(1) label', 'edited again!')

    // empty value should remove
    browser
      .dblClick('.todo label')
      .enterValue('.todo:nth-child(1) .edit', ' ')
      .assert.count('.todo', 3)

    // toggle all
    browser
      .click('.toggle-all')
      .assert.count('.todo.completed', 3)
      .click('.toggle-all')
      .assert.count('.todo:not(.completed)', 3)
      .end()

    function createNewItem (text) {
      return browser.enterValue('.new-todo', text)
    }

    function removeItemAt (n) {
      return browser
        .moveToElement('.todo:nth-child(' + n + ')', 10, 10)
        .click('.todo:nth-child(' + n + ') .destroy')
    }
  }
}
