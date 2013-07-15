$(function () {

    module("bootstrap-typeahead")

      test("should be defined on jquery object", function () {
        ok($(document.body).typeahead, 'alert method is defined')
      })

      test("should return element", function () {
        ok($(document.body).typeahead()[0] == document.body, 'document.body returned')
      })

      test("should listen to an input", function () {
        var $input = $('<input />')
        $input.typeahead()
        ok($input.data('events').blur, 'has a blur event')
        ok($input.data('events').keypress, 'has a keypress event')
        ok($input.data('events').keyup, 'has a keyup event')
        if ($.browser.webkit || $.browser.msie) {
          ok($input.data('events').keydown, 'has a keydown event')
        } else {
          ok($input.data('events').keydown, 'does not have a keydown event')
        }
      })

      test("should create a menu", function () {
        var $input = $('<input />')
        ok($input.typeahead().data('typeahead').$menu, 'has a menu')
      })

      test("should listen to the menu", function () {
        var $input = $('<input />')
          , $menu = $input.typeahead().data('typeahead').$menu

        ok($menu.data('events').mouseover, 'has a mouseover(pseudo: mouseenter)')
        ok($menu.data('events').click, 'has a click')
      })

      test("should show menu when query entered", function () {
        var $input = $('<input />').typeahead({
              source: ['aa', 'ab', 'ac']
            })
          , typeahead = $input.data('typeahead')

        $input.val('a')
        typeahead.lookup()

        ok(typeahead.$menu.is(":visible"), 'typeahead is visible')
        equals(typeahead.$menu.find('li').length, 3, 'has 3 items in menu')
        equals(typeahead.$menu.find('.active').length, 1, 'one item is active')

        typeahead.$menu.remove()
      })

      test("should not explode when regex chars are entered", function () {
        var $input = $('<input />').typeahead({
              source: ['aa', 'ab', 'ac', 'mdo*', 'fat+']
            })
          , typeahead = $input.data('typeahead')

        $input.val('+')
        typeahead.lookup()

        ok(typeahead.$menu.is(":visible"), 'typeahead is visible')
        equals(typeahead.$menu.find('li').length, 1, 'has 1 item in menu')
        equals(typeahead.$menu.find('.active').length, 1, 'one item is active')

        typeahead.$menu.remove()
      })

      test("should hide menu when query entered", function () {
        stop()
        var $input = $('<input />').typeahead({
              source: ['aa', 'ab', 'ac']
            })
          , typeahead = $input.data('typeahead')

        $input.val('a')
        typeahead.lookup()

        ok(typeahead.$menu.is(":visible"), 'typeahead is visible')
        equals(typeahead.$menu.find('li').length, 3, 'has 3 items in menu')
        equals(typeahead.$menu.find('.active').length, 1, 'one item is active')

        $input.blur()

        setTimeout(function () {
          ok(!typeahead.$menu.is(":visible"), "typeahead is no longer visible")
          start()
        }, 200)

        typeahead.$menu.remove()
      })

      test("should set next item when down arrow is pressed", function () {
        var $input = $('<input />').typeahead({
              source: ['aa', 'ab', 'ac']
            })
          , typeahead = $input.data('typeahead')

        $input.val('a')
        typeahead.lookup()

        ok(typeahead.$menu.is(":visible"), 'typeahead is visible')
        equals(typeahead.$menu.find('li').length, 3, 'has 3 items in menu')
        equals(typeahead.$menu.find('.active').length, 1, 'one item is active')
        ok(typeahead.$menu.find('li').first().hasClass('active'), "first item is active")

        $input.trigger({
          type: 'keydown'
        , keyCode: 40
        })

        ok(typeahead.$menu.find('li').first().next().hasClass('active'), "second item is active")


        $input.trigger({
          type: 'keydown'
        , keyCode: 38
        })

        ok(typeahead.$menu.find('li').first().hasClass('active'), "first item is active")

        typeahead.$menu.remove()
      })


      test("should set input value to selected item", function () {
        var $input = $('<input />').typeahead({
              source: ['aa', 'ab', 'ac']
            })
          , typeahead = $input.data('typeahead')
          , changed = false

        $input.val('a')
        typeahead.lookup()

        $input.change(function() { changed = true });

        $(typeahead.$menu.find('li')[2]).mouseover().click()

        equals($input.val(), 'ac', 'input value was correctly set')
        ok(!typeahead.$menu.is(':visible'), 'the menu was hidden')
        ok(changed, 'a change event was fired')

        typeahead.$menu.remove()
      })
})
