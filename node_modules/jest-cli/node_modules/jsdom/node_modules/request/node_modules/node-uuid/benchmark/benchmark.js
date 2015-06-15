try {
  var nodeuuid = require('../uuid');
} catch (e) {
  console.error('node-uuid require failed - skipping tests');
}

try {
  var uuid = require('uuid');
} catch (e) {
  console.error('uuid require failed - skipping tests');
}

try {
  var uuidjs = require('uuid-js');
} catch (e) {
  console.error('uuid-js require failed - skipping tests');
}

var N = 5e5;

function rate(msg, t) {
  console.log(msg + ': ' +
    (N / (Date.now() - t) * 1e3 | 0) +
    ' uuids/second');
}

console.log('# v4');

// node-uuid - string form
if (nodeuuid) {
  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v4();
  rate('nodeuuid.v4() - using node.js crypto RNG', t);

  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v4({rng: nodeuuid.mathRNG});
  rate('nodeuuid.v4() - using Math.random() RNG', t);

  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v4('binary');
  rate('nodeuuid.v4(\'binary\')', t);

  var buffer = new nodeuuid.BufferClass(16);
  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v4('binary', buffer);
  rate('nodeuuid.v4(\'binary\', buffer)', t);
}

// libuuid - string form
if (uuid) {
  for (var i = 0, t = Date.now(); i < N; i++) uuid();
  rate('uuid()', t);

  for (var i = 0, t = Date.now(); i < N; i++) uuid('binary');
  rate('uuid(\'binary\')', t);
}

// uuid-js - string form
if (uuidjs) {
  for (var i = 0, t = Date.now(); i < N; i++) uuidjs.create(4);
  rate('uuidjs.create(4)', t);
}

// 140byte.es
for (var i = 0, t = Date.now(); i < N; i++) 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(s,r){r=Math.random()*16|0;return (s=='x'?r:r&0x3|0x8).toString(16)});
rate('140byte.es_v4', t);

console.log('');
console.log('# v1');

// node-uuid - v1 string form
if (nodeuuid) {
  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v1();
  rate('nodeuuid.v1()', t);

  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v1('binary');
  rate('nodeuuid.v1(\'binary\')', t);

  var buffer = new nodeuuid.BufferClass(16);
  for (var i = 0, t = Date.now(); i < N; i++) nodeuuid.v1('binary', buffer);
  rate('nodeuuid.v1(\'binary\', buffer)', t);
}

// uuid-js - v1 string form
if (uuidjs) {
  for (var i = 0, t = Date.now(); i < N; i++) uuidjs.create(1);
  rate('uuidjs.create(1)', t);
}
