$(function () {

    module("bootstrap-collapse")

      test("should be defined on jquery object", function () {
        ok($(document.body).collapse, 'collapse method is defined')
      })

      test("should return element", function () {
        ok($(document.body).collapse()[0] == document.body, 'document.body returned')
      })

      test("should show a collapsed element", function () {
        var el = $('<div class="collapse"></div>').collapse('show')
        ok(el.hasClass('in'), 'has class in')
        ok(/height/.test(el.attr('style')), 'has height set')
      })

      test("should hide a collapsed element", function () {
        var el = $('<div class="collapse"></div>').collapse('hide')
        ok(!el.hasClass('in'), 'does not have class in')
        ok(/height/.test(el.attr('style')), 'has height set')
      })

      test("should not fire shown when show is prevented", function () {
        $.support.transition = false
        stop();
        $('<div class="collapse"/>')
          .bind('show', function (e) {
            e.preventDefault();
            ok(true);
            start();
          })
          .bind('shown', function () {
            ok(false);
          })
          .collapse('show')
      })

      test("should reset style to auto after finishing opening collapse", function () {
        $.support.transition = false
        stop();
        $('<div class="collapse" style="height: 0px"/>')
          .bind('show', function () {
            ok(this.style.height == '0px')
          })
          .bind('shown', function () {
            ok(this.style.height == 'auto')
            start()
          })
          .collapse('show')
      })

})