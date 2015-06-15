$(document).ready(function() {

  module("Arrays");

  test("arrays: first", function() {
    equals(_.first([1,2,3]), 1, 'can pull out the first element of an array');
    equals(_([1, 2, 3]).first(), 1, 'can perform OO-style "first()"');
    equals(_.first([1,2,3], 0).join(', '), "", 'can pass an index to first');
    equals(_.first([1,2,3], 2).join(', '), '1, 2', 'can pass an index to first');
    var result = (function(){ return _.first(arguments); })(4, 3, 2, 1);
    equals(result, 4, 'works on an arguments object.');
    result = _.map([[1,2,3],[1,2,3]], _.first);
    equals(result.join(','), '1,1', 'works well with _.map');
  });

  test("arrays: rest", function() {
    var numbers = [1, 2, 3, 4];
    equals(_.rest(numbers).join(", "), "2, 3, 4", 'working rest()');
    equals(_.rest(numbers, 0).join(", "), "1, 2, 3, 4", 'working rest(0)');
    equals(_.rest(numbers, 2).join(', '), '3, 4', 'rest can take an index');
    var result = (function(){ return _(arguments).tail(); })(1, 2, 3, 4);
    equals(result.join(', '), '2, 3, 4', 'aliased as tail and works on arguments object');
    result = _.map([[1,2,3],[1,2,3]], _.rest);
    equals(_.flatten(result).join(','), '2,3,2,3', 'works well with _.map');
  });

  test("arrays: initial", function() {
    equals(_.initial([1,2,3,4,5]).join(", "), "1, 2, 3, 4", 'working initial()');
    equals(_.initial([1,2,3,4],2).join(", "), "1, 2", 'initial can take an index');
    var result = (function(){ return _(arguments).initial(); })(1, 2, 3, 4);
    equals(result.join(", "), "1, 2, 3", 'initial works on arguments object');
    result = _.map([[1,2,3],[1,2,3]], _.initial);
    equals(_.flatten(result).join(','), '1,2,1,2', 'initial works with _.map');
  });

  test("arrays: last", function() {
    equals(_.last([1,2,3]), 3, 'can pull out the last element of an array');
    equals(_.last([1,2,3], 0).join(', '), "", 'can pass an index to last');
    equals(_.last([1,2,3], 2).join(', '), '2, 3', 'can pass an index to last');
    var result = (function(){ return _(arguments).last(); })(1, 2, 3, 4);
    equals(result, 4, 'works on an arguments object');
    result = _.map([[1,2,3],[1,2,3]], _.last);
    equals(result.join(','), '3,3', 'works well with _.map');
  });

  test("arrays: compact", function() {
    equals(_.compact([0, 1, false, 2, false, 3]).length, 3, 'can trim out all falsy values');
    var result = (function(){ return _(arguments).compact().length; })(0, 1, false, 2, false, 3);
    equals(result, 3, 'works on an arguments object');
  });

  test("arrays: flatten", function() {
    if (window.JSON) {
      var list = [1, [2], [3, [[[4]]]]];
      equals(JSON.stringify(_.flatten(list)), '[1,2,3,4]', 'can flatten nested arrays');
      equals(JSON.stringify(_.flatten(list, true)), '[1,2,3,[[[4]]]]', 'can shallowly flatten nested arrays');
      var result = (function(){ return _.flatten(arguments); })(1, [2], [3, [[[4]]]]);
      equals(JSON.stringify(result), '[1,2,3,4]', 'works on an arguments object');
    }
  });

  test("arrays: without", function() {
    var list = [1, 2, 1, 0, 3, 1, 4];
    equals(_.without(list, 0, 1).join(', '), '2, 3, 4', 'can remove all instances of an object');
    var result = (function(){ return _.without(arguments, 0, 1); })(1, 2, 1, 0, 3, 1, 4);
    equals(result.join(', '), '2, 3, 4', 'works on an arguments object');

    var list = [{one : 1}, {two : 2}];
    ok(_.without(list, {one : 1}).length == 2, 'uses real object identity for comparisons.');
    ok(_.without(list, list[0]).length == 1, 'ditto.');
  });

  test("arrays: uniq", function() {
    var list = [1, 2, 1, 3, 1, 4];
    equals(_.uniq(list).join(', '), '1, 2, 3, 4', 'can find the unique values of an unsorted array');

    var list = [1, 1, 1, 2, 2, 3];
    equals(_.uniq(list, true).join(', '), '1, 2, 3', 'can find the unique values of a sorted array faster');

    var list = [{name:'moe'}, {name:'curly'}, {name:'larry'}, {name:'curly'}];
    var iterator = function(value) { return value.name; };
    equals(_.map(_.uniq(list, false, iterator), iterator).join(', '), 'moe, curly, larry', 'can find the unique values of an array using a custom iterator');

    var iterator = function(value) { return value +1; };
    var list = [1, 2, 2, 3, 4, 4];
    equals(_.uniq(list, true, iterator).join(', '), '1, 2, 3, 4', 'iterator works with sorted array');

    var result = (function(){ return _.uniq(arguments); })(1, 2, 1, 3, 1, 4);
    equals(result.join(', '), '1, 2, 3, 4', 'works on an arguments object');
  });

  test("arrays: intersection", function() {
    var stooges = ['moe', 'curly', 'larry'], leaders = ['moe', 'groucho'];
    equals(_.intersection(stooges, leaders).join(''), 'moe', 'can take the set intersection of two arrays');
    equals(_(stooges).intersection(leaders).join(''), 'moe', 'can perform an OO-style intersection');
    var result = (function(){ return _.intersection(arguments, leaders); })('moe', 'curly', 'larry');
    equals(result.join(''), 'moe', 'works on an arguments object');
  });

  test("arrays: union", function() {
    var result = _.union([1, 2, 3], [2, 30, 1], [1, 40]);
    equals(result.join(' '), '1 2 3 30 40', 'takes the union of a list of arrays');

    var result = _.union([1, 2, 3], [2, 30, 1], [1, 40, [1]]);
    equals(result.join(' '), '1 2 3 30 40 1', 'takes the union of a list of nested arrays');
  });

  test("arrays: difference", function() {
    var result = _.difference([1, 2, 3], [2, 30, 40]);
    equals(result.join(' '), '1 3', 'takes the difference of two arrays');
  });

  test('arrays: zip', function() {
    var names = ['moe', 'larry', 'curly'], ages = [30, 40, 50], leaders = [true];
    var stooges = _.zip(names, ages, leaders);
    equals(String(stooges), 'moe,30,true,larry,40,,curly,50,', 'zipped together arrays of different lengths');
  });

  test("arrays: indexOf", function() {
    var numbers = [1, 2, 3];
    numbers.indexOf = null;
    equals(_.indexOf(numbers, 2), 1, 'can compute indexOf, even without the native function');
    var result = (function(){ return _.indexOf(arguments, 2); })(1, 2, 3);
    equals(result, 1, 'works on an arguments object');
    equals(_.indexOf(null, 2), -1, 'handles nulls properly');

    var numbers = [10, 20, 30, 40, 50], num = 35;
    var index = _.indexOf(numbers, num, true);
    equals(index, -1, '35 is not in the list');

    numbers = [10, 20, 30, 40, 50]; num = 40;
    index = _.indexOf(numbers, num, true);
    equals(index, 3, '40 is in the list');

    numbers = [1, 40, 40, 40, 40, 40, 40, 40, 50, 60, 70]; num = 40;
    index = _.indexOf(numbers, num, true);
    equals(index, 1, '40 is in the list');
  });

  test("arrays: lastIndexOf", function() {
    var numbers = [1, 0, 1, 0, 0, 1, 0, 0, 0];
    numbers.lastIndexOf = null;
    equals(_.lastIndexOf(numbers, 1), 5, 'can compute lastIndexOf, even without the native function');
    equals(_.lastIndexOf(numbers, 0), 8, 'lastIndexOf the other element');
    var result = (function(){ return _.lastIndexOf(arguments, 1); })(1, 0, 1, 0, 0, 1, 0, 0, 0);
    equals(result, 5, 'works on an arguments object');
    equals(_.indexOf(null, 2), -1, 'handles nulls properly');
  });

  test("arrays: range", function() {
    equals(_.range(0).join(''), '', 'range with 0 as a first argument generates an empty array');
    equals(_.range(4).join(' '), '0 1 2 3', 'range with a single positive argument generates an array of elements 0,1,2,...,n-1');
    equals(_.range(5, 8).join(' '), '5 6 7', 'range with two arguments a &amp; b, a&lt;b generates an array of elements a,a+1,a+2,...,b-2,b-1');
    equals(_.range(8, 5).join(''), '', 'range with two arguments a &amp; b, b&lt;a generates an empty array');
    equals(_.range(3, 10, 3).join(' '), '3 6 9', 'range with three arguments a &amp; b &amp; c, c &lt; b-a, a &lt; b generates an array of elements a,a+c,a+2c,...,b - (multiplier of a) &lt; c');
    equals(_.range(3, 10, 15).join(''), '3', 'range with three arguments a &amp; b &amp; c, c &gt; b-a, a &lt; b generates an array with a single element, equal to a');
    equals(_.range(12, 7, -2).join(' '), '12 10 8', 'range with three arguments a &amp; b &amp; c, a &gt; b, c &lt; 0 generates an array of elements a,a-c,a-2c and ends with the number not less than b');
    equals(_.range(0, -10, -1).join(' '), '0 -1 -2 -3 -4 -5 -6 -7 -8 -9', 'final example in the Python docs');
  });

});
