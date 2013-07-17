$(function () {

    module("bootstrap-tooltip")

      test("should be defined on jquery object", function () {
        var div = $("<div></div>")
        ok(div.tooltip, 'popover method is defined')
      })

      test("should return element", function () {
        var div = $("<div></div>")
        ok(div.tooltip() == div, 'document.body returned')
      })

      test("should expose default settings", function () {
        ok(!!$.fn.tooltip.defaults, 'defaults is defined')
      })

      test("should remove title attribute", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>').tooltip()
        ok(!tooltip.attr('title'), 'title tag was removed')
      })

      test("should add data attribute for referencing original title", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>').tooltip()
        equals(tooltip.attr('data-original-title'), 'Another tooltip', 'original title preserved in data attribute')
      })

      test("should place tooltips relative to placement option", function () {
        $.support.transition = false
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({placement: 'bottom'})
          .tooltip('show')

        ok($(".tooltip").is('.fade.bottom.in'), 'has correct classes applied')
        tooltip.tooltip('hide')
      })

      test("should always allow html entities", function () {
        $.support.transition = false
        var tooltip = $('<a href="#" rel="tooltip" title="<b>@fat</b>"></a>')
          .appendTo('#qunit-fixture')
          .tooltip('show')

        ok($('.tooltip b').length, 'b tag was inserted')
        tooltip.tooltip('hide')
        ok(!$(".tooltip").length, 'tooltip removed')
      })

      test("should respect custom classes", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({ template: '<div class="tooltip some-class"><div class="tooltip-arrow"/><div class="tooltip-inner"/></div>'})
          .tooltip('show')

        ok($('.tooltip').hasClass('some-class'), 'custom class is present')
        tooltip.tooltip('hide')
        ok(!$(".tooltip").length, 'tooltip removed')
      })

      test("should not show tooltip if leave event occurs before delay expires", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({ delay: 200 })

        stop()

        tooltip.trigger('mouseenter')

        setTimeout(function () {
          ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
          tooltip.trigger('mouseout')
          setTimeout(function () {
            ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
            start()
          }, 200)
        }, 100)
      })

      test("should not show tooltip if leave event occurs before delay expires, even if hide delay is 0", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({ delay: { show: 200, hide: 0} })

        stop()

        tooltip.trigger('mouseenter')

        setTimeout(function () {
          ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
          tooltip.trigger('mouseout')
          setTimeout(function () {
            ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
            start()
          }, 200)
        }, 100)
      })

      test("should not show tooltip if leave event occurs before delay expires", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({ delay: 100 })
        stop()
        tooltip.trigger('mouseenter')
        setTimeout(function () {
          ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
          tooltip.trigger('mouseout')
          setTimeout(function () {
            ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
            start()
          }, 100)
        }, 50)
      })

      test("should show tooltip if leave event hasn't occured before delay expires", function () {
        var tooltip = $('<a href="#" rel="tooltip" title="Another tooltip"></a>')
          .appendTo('#qunit-fixture')
          .tooltip({ delay: 150 })
        stop()
        tooltip.trigger('mouseenter')
        setTimeout(function () {
          ok(!$(".tooltip").is('.fade.in'), 'tooltip is not faded in')
        }, 100)
        setTimeout(function () {
          ok($(".tooltip").is('.fade.in'), 'tooltip has faded in')
          start()
        }, 200)
      })

      test("should detect if title string is html or text: foo", function () {
        ok(!$.fn.tooltip.Constructor.prototype.isHTML('foo'), 'correctly detected html')
      })

      test("should detect if title string is html or text: &amp;lt;foo&amp;gt;", function () {
        ok(!$.fn.tooltip.Constructor.prototype.isHTML('&lt;foo&gt;'), 'correctly detected html')
      })

      test("should detect if title string is html or text: &lt;div>foo&lt;/div>", function () {
        ok($.fn.tooltip.Constructor.prototype.isHTML('<div>foo</div>'), 'correctly detected html')
      })

      test("should detect if title string is html or text: asdfa&lt;div>foo&lt;/div>asdfasdf", function () {
        ok($.fn.tooltip.Constructor.prototype.isHTML('asdfa<div>foo</div>asdfasdf'), 'correctly detected html')
      })

      test("should detect if title string is html or text: document.createElement('div')", function () {
        ok($.fn.tooltip.Constructor.prototype.isHTML(document.createElement('div')), 'correctly detected html')
      })

      test("should detect if title string is html or text: $('&lt;div />)", function () {
        ok($.fn.tooltip.Constructor.prototype.isHTML($('<div></div>')), 'correctly detected html')
      })

})
