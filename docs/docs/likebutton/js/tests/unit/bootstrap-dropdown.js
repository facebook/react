$(function () {

    module("bootstrap-dropdowns")

      test("should be defined on jquery object", function () {
        ok($(document.body).dropdown, 'dropdown method is defined')
      })

      test("should return element", function () {
        ok($(document.body).dropdown()[0] == document.body, 'document.body returned')
      })

      test("should not open dropdown if target is disabled", function () {
        var dropdownHTML = '<ul class="tabs">'
          + '<li class="dropdown">'
          + '<button disabled href="#" class="btn dropdown-toggle" data-toggle="dropdown">Dropdown</button>'
          + '<ul class="dropdown-menu">'
          + '<li><a href="#">Secondary link</a></li>'
          + '<li><a href="#">Something else here</a></li>'
          + '<li class="divider"></li>'
          + '<li><a href="#">Another link</a></li>'
          + '</ul>'
          + '</li>'
          + '</ul>'
          , dropdown = $(dropdownHTML).find('[data-toggle="dropdown"]').dropdown().click()

        ok(!dropdown.parent('.dropdown').hasClass('open'), 'open class added on click')
      })

      test("should not open dropdown if target is disabled", function () {
        var dropdownHTML = '<ul class="tabs">'
          + '<li class="dropdown">'
          + '<button href="#" class="btn dropdown-toggle disabled" data-toggle="dropdown">Dropdown</button>'
          + '<ul class="dropdown-menu">'
          + '<li><a href="#">Secondary link</a></li>'
          + '<li><a href="#">Something else here</a></li>'
          + '<li class="divider"></li>'
          + '<li><a href="#">Another link</a></li>'
          + '</ul>'
          + '</li>'
          + '</ul>'
          , dropdown = $(dropdownHTML).find('[data-toggle="dropdown"]').dropdown().click()

        ok(!dropdown.parent('.dropdown').hasClass('open'), 'open class added on click')
      })

      test("should add class open to menu if clicked", function () {
        var dropdownHTML = '<ul class="tabs">'
          + '<li class="dropdown">'
          + '<a href="#" class="dropdown-toggle" data-toggle="dropdown">Dropdown</a>'
          + '<ul class="dropdown-menu">'
          + '<li><a href="#">Secondary link</a></li>'
          + '<li><a href="#">Something else here</a></li>'
          + '<li class="divider"></li>'
          + '<li><a href="#">Another link</a></li>'
          + '</ul>'
          + '</li>'
          + '</ul>'
          , dropdown = $(dropdownHTML).find('[data-toggle="dropdown"]').dropdown().click()

        ok(dropdown.parent('.dropdown').hasClass('open'), 'open class added on click')
      })

      test("should remove open class if body clicked", function () {
        var dropdownHTML = '<ul class="tabs">'
          + '<li class="dropdown">'
          + '<a href="#" class="dropdown-toggle" data-toggle="dropdown">Dropdown</a>'
          + '<ul class="dropdown-menu">'
          + '<li><a href="#">Secondary link</a></li>'
          + '<li><a href="#">Something else here</a></li>'
          + '<li class="divider"></li>'
          + '<li><a href="#">Another link</a></li>'
          + '</ul>'
          + '</li>'
          + '</ul>'
          , dropdown = $(dropdownHTML)
            .appendTo('#qunit-fixture')
            .find('[data-toggle="dropdown"]')
            .dropdown()
            .click()
        ok(dropdown.parent('.dropdown').hasClass('open'), 'open class added on click')
        $('body').click()
        ok(!dropdown.parent('.dropdown').hasClass('open'), 'open class removed')
        dropdown.remove()
      })

})