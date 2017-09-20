const React = require('react');
const Reconciler = require('react-reconciler');
const assert = require('assert');
const A = Reconciler({});
const B = Reconciler({});

assert(global.valueStacks.length === 2);
assert(global.valueStacks[0] !== global.valueStacks[1]);
console.log('Ok!');

