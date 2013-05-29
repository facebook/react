/*global exports:true*/
var classes = require('./transforms/classes');
var react = require('./transforms/react');
var reactDisplayName = require('./transforms/reactDisplayName');

/**
 * Map from transformName => orderedListOfVisitors.
 */
var transformVisitors = {
  'es6-classes': [
    classes.visitClassExpression,
    classes.visitClassDeclaration,
    classes.visitSuperCall,
    classes.visitPrivateProperty
  ]
};

transformVisitors.react = transformVisitors[
  "es6-classes"
].concat([
  react.visitReactTag,
  reactDisplayName.visitReactDisplayName
]);

/**
 * Specifies the order in which each transform should run.
 */
var transformRunOrder = [
  'es6-classes',
  'react'
];

/**
 * Given a list of transform names, return the ordered list of visitors to be
 * passed to the transform() function.
 *
 * @param {array?} excludes
 * @return {array}
 */
function getVisitorsList(excludes) {
  var ret = [];
  for (var i = 0, il = transformRunOrder.length; i < il; i++) {
    if (!excludes || excludes.indexOf(transformRunOrder[i]) === -1) {
      ret = ret.concat(transformVisitors[transformRunOrder[i]]);
    }
  }
  return ret;
}

exports.getVisitorsList = getVisitorsList;
exports.transformVisitors = transformVisitors;
