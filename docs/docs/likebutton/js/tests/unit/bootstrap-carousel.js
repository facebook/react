$(function () {

    module("bootstrap-carousel")

      test("should be defined on jquery object", function () {
        ok($(document.body).carousel, 'carousel method is defined')
      })

      test("should return element", function () {
        ok($(document.body).carousel()[0] == document.body, 'document.body returned')
      })

      test("should not fire sliden when slide is prevented", function () {
        $.support.transition = false
        stop();
        $('<div class="carousel"/>')
          .bind('slide', function (e) {
            e.preventDefault();
            ok(true);
            start();
          })
          .bind('slid', function () {
            ok(false);
          })
          .carousel('next')
      })

})