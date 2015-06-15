(function() {

  var func = function(){};
  var date = new Date();
  var str = "a string";
  var numbers = [];
  for (var i=0; i<1000; i++) numbers.push(i);
  var objects = _.map(numbers, function(n){ return {num : n}; });
  var randomized = _.sortBy(numbers, function(){ return Math.random(); });

  JSLitmus.test('_.isNumber', function() {
    return _.isNumber(1000)
  });

  JSLitmus.test('_.newIsNumber', function() {
    return _.newIsNumber(1000)
  });

  JSLitmus.test('_.isNumber(NaN)', function() {
    return _.isNumber(NaN)
  });

  JSLitmus.test('_.newIsNumber(NaN)', function() {
    return _.newIsNumber(NaN)
  });

})();