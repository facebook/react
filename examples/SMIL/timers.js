function Timers($window) {
  var requestAnimFrame = (function () {
    var raf = $window.requestAnimationFrame ||
      $window.webkitRequestAnimationFrame ||
      $window.mozRequestAnimationFrame ||
      $window.oRequestAnimationFrame ||
      $window.msRequestAnimationFrame;
    if (!raf) { throw new Error("RequestAnimationFrame not supported"); }
    return raf;
  })();

  var cancelAnimFrame = (function () {
    return $window.cancelAnimationFrame ||
      $window.webkitCancelAnimationFrame ||
      $window.mozCancelRequestAnimationFrame ||
      $window.oCancelRequestAnimationFrame ||
      $window.msCancelRequestAnimationFrame;
  })();

  var requestInterval = function (fn, delay) {
    var start = new Date().getTime(), handle = {};

    function loop() {
      var current = new Date().getTime(), delta = current - start;
      if (delta >= delay) {
        fn.call();
        start = new Date().getTime();
      }

      handle.value = requestAnimFrame(loop);
    }

    handle.value = requestAnimFrame(loop);
    return handle;
  };

  var requestTimeout = function (fn, delay) {
    var start = new Date().getTime(), handle = {};

    function loop() {
      var current = new Date().getTime(), delta = current - start;
      delta >= delay ? fn.call() : handle.value = requestAnimFrame(loop);
    }

    handle.value = requestAnimFrame(loop);
    return handle;
  };

  var clear = function (handle) {
    handle && handle.value && cancelAnimFrame(handle.value);
  };

  function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      clear(timeout);
      timeout = requestTimeout(function () {
        timeout = null;
        if (!immediate)
          func.apply(context, args);
      }, wait);
      if (immediate && !timeout)
        func.apply(context, args);
    };
  }

  function throttle(callback, threshold) {
    var suppress = false, handle;
    var clear = function () {
      suppress = false;
      clear(handle);
    };
    return function () {
      if (!suppress) {
        callback.apply(this, arguments);
        handle = requestTimeout(clear, threshold);
        suppress = true;
      }
    };
  }

  return {
    requestTimeout: requestTimeout,
    clearTimeout: clear,
    requestInterval: requestInterval,
    clearInterval: clear,
    debounce: debounce,
    throttle: throttle
  };
}
window.Timers = Timers(window);