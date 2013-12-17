if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'Trivial benchmark to verify that everything works';

exports.setup = function(){
  var foo;
};
exports.fn = function(){
  foo = Array(999).join('Howdy!\n');
};
exports.teardown = function(){
  foo = null;
};
