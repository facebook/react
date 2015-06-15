$(document).ready(function() {

  module("Functions");

  test("functions: bind", function() {
    var context = {name : 'moe'};
    var func = function(arg) { return "name: " + (this.name || arg); };
    var bound = _.bind(func, context);
    equals(bound(), 'name: moe', 'can bind a function to a context');

    bound = _(func).bind(context);
    equals(bound(), 'name: moe', 'can do OO-style binding');

    bound = _.bind(func, null, 'curly');
    equals(bound(), 'name: curly', 'can bind without specifying a context');

    func = function(salutation, name) { return salutation + ': ' + name; };
    func = _.bind(func, this, 'hello');
    equals(func('moe'), 'hello: moe', 'the function was partially applied in advance');

    var func = _.bind(func, this, 'curly');
    equals(func(), 'hello: curly', 'the function was completely applied in advance');

    var func = function(salutation, firstname, lastname) { return salutation + ': ' + firstname + ' ' + lastname; };
    func = _.bind(func, this, 'hello', 'moe', 'curly');
    equals(func(), 'hello: moe curly', 'the function was partially applied in advance and can accept multiple arguments');

    func = function(context, message) { equals(this, context, message); };
    _.bind(func, 0, 0, 'can bind a function to `0`')();
    _.bind(func, '', '', 'can bind a function to an empty string')();
    _.bind(func, false, false, 'can bind a function to `false`')();

    // These tests are only meaningful when using a browser without a native bind function
    // To test this with a modern browser, set underscore's nativeBind to undefined
    var F = function () { return this; };
    var Boundf = _.bind(F, {hello: "moe curly"});
    equal(new Boundf().hello, undefined, "function should not be bound to the context, to comply with ECMAScript 5");
    equal(Boundf().hello, "moe curly", "When called without the new operator, it's OK to be bound to the context");
  });

  test("functions: bindAll", function() {
    var curly = {name : 'curly'}, moe = {
      name    : 'moe',
      getName : function() { return 'name: ' + this.name; },
      sayHi   : function() { return 'hi: ' + this.name; }
    };
    curly.getName = moe.getName;
    _.bindAll(moe, 'getName', 'sayHi');
    curly.sayHi = moe.sayHi;
    equals(curly.getName(), 'name: curly', 'unbound function is bound to current object');
    equals(curly.sayHi(), 'hi: moe', 'bound function is still bound to original object');

    curly = {name : 'curly'};
    moe = {
      name    : 'moe',
      getName : function() { return 'name: ' + this.name; },
      sayHi   : function() { return 'hi: ' + this.name; }
    };
    _.bindAll(moe);
    curly.sayHi = moe.sayHi;
    equals(curly.sayHi(), 'hi: moe', 'calling bindAll with no arguments binds all functions to the object');
  });

  test("functions: memoize", function() {
    var fib = function(n) {
      return n < 2 ? n : fib(n - 1) + fib(n - 2);
    };
    var fastFib = _.memoize(fib);
    equals(fib(10), 55, 'a memoized version of fibonacci produces identical results');
    equals(fastFib(10), 55, 'a memoized version of fibonacci produces identical results');

    var o = function(str) {
      return str;
    };
    var fastO = _.memoize(o);
    equals(o('toString'), 'toString', 'checks hasOwnProperty');
    equals(fastO('toString'), 'toString', 'checks hasOwnProperty');
  });

  asyncTest("functions: delay", 2, function() {
    var delayed = false;
    _.delay(function(){ delayed = true; }, 100);
    setTimeout(function(){ ok(!delayed, "didn't delay the function quite yet"); }, 50);
    setTimeout(function(){ ok(delayed, 'delayed the function'); start(); }, 150);
  });

  asyncTest("functions: defer", 1, function() {
    var deferred = false;
    _.defer(function(bool){ deferred = bool; }, true);
    _.delay(function(){ ok(deferred, "deferred the function"); start(); }, 50);
  });

  asyncTest("functions: throttle", 2, function() {
    var counter = 0;
    var incr = function(){ counter++; };
    var throttledIncr = _.throttle(incr, 100);
    throttledIncr(); throttledIncr(); throttledIncr();
    setTimeout(throttledIncr, 70);
    setTimeout(throttledIncr, 120);
    setTimeout(throttledIncr, 140);
    setTimeout(throttledIncr, 190);
    setTimeout(throttledIncr, 220);
    setTimeout(throttledIncr, 240);
    _.delay(function(){ ok(counter == 1, "incr was called immediately"); }, 30);
    _.delay(function(){ ok(counter == 4, "incr was throttled"); start(); }, 400);
  });

  asyncTest("functions: throttle arguments", 2, function() {
    var value = 0;
    var update = function(val){ value = val; };
    var throttledUpdate = _.throttle(update, 100);
    throttledUpdate(1); throttledUpdate(2); throttledUpdate(3);
    setTimeout(function(){ throttledUpdate(4); }, 120);
    setTimeout(function(){ throttledUpdate(5); }, 140);
    setTimeout(function(){ throttledUpdate(6); }, 260);
    setTimeout(function(){ throttledUpdate(7); }, 270);
    _.delay(function(){ ok(value == 1, "updated to latest value"); }, 40);
    _.delay(function(){ ok(value == 7, "updated to latest value"); start(); }, 400);
  });

  asyncTest("functions: throttle once", 1, function() {
    var counter = 0;
    var incr = function(){ counter++; };
    var throttledIncr = _.throttle(incr, 100);
    throttledIncr();
    _.delay(function(){ ok(counter == 1, "incr was called once"); start(); }, 220);
  });

  asyncTest("functions: throttle twice", 1, function() {
    var counter = 0;
    var incr = function(){ counter++; };
    var throttledIncr = _.throttle(incr, 100);
    throttledIncr(); throttledIncr();
    _.delay(function(){ ok(counter == 2, "incr was called twice"); start(); }, 220);
  });

  asyncTest("functions: debounce", 1, function() {
    var counter = 0;
    var incr = function(){ counter++; };
    var debouncedIncr = _.debounce(incr, 50);
    debouncedIncr(); debouncedIncr(); debouncedIncr();
    setTimeout(debouncedIncr, 30);
    setTimeout(debouncedIncr, 60);
    setTimeout(debouncedIncr, 90);
    setTimeout(debouncedIncr, 120);
    setTimeout(debouncedIncr, 150);
    _.delay(function(){ ok(counter == 1, "incr was debounced"); start(); }, 220);
  });

  test("functions: once", function() {
    var num = 0;
    var increment = _.once(function(){ num++; });
    increment();
    increment();
    equals(num, 1);
  });

  test("functions: wrap", function() {
    var greet = function(name){ return "hi: " + name; };
    var backwards = _.wrap(greet, function(func, name){ return func(name) + ' ' + name.split('').reverse().join(''); });
    equals(backwards('moe'), 'hi: moe eom', 'wrapped the saluation function');

    var inner = function(){ return "Hello "; };
    var obj   = {name : "Moe"};
    obj.hi    = _.wrap(inner, function(fn){ return fn() + this.name; });
    equals(obj.hi(), "Hello Moe");
  });

  test("functions: compose", function() {
    var greet = function(name){ return "hi: " + name; };
    var exclaim = function(sentence){ return sentence + '!'; };
    var composed = _.compose(exclaim, greet);
    equals(composed('moe'), 'hi: moe!', 'can compose a function that takes another');

    composed = _.compose(greet, exclaim);
    equals(composed('moe'), 'hi: moe!', 'in this case, the functions are also commutative');
  });

  test("functions: after", function() {
    var testAfter = function(afterAmount, timesCalled) {
      var afterCalled = 0;
      var after = _.after(afterAmount, function() {
        afterCalled++;
      });
      while (timesCalled--) after();
      return afterCalled;
    };

    equals(testAfter(5, 5), 1, "after(N) should fire after being called N times");
    equals(testAfter(5, 4), 0, "after(N) should not fire unless called N times");
  });

});
