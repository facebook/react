/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

function getDOMNodeToFindDOMNode(file, api, options) {
  const j = api.jscodeshift;

  require('./utils/array-polyfills');
  const ReactUtils = require('./utils/ReactUtils')(j);

  const printOptions =
    options.printOptions || {quote: 'single', trailingComma: true};
  const root = j(file.source);

  const createReactFindDOMNodeCall = arg => j.callExpression(
    j.memberExpression(
      j.identifier('React'),
      j.identifier('findDOMNode'),
      false
    ),
    [arg]
  );

  const updateRefCall = (path, refName) => {
    j(path)
      .find(j.CallExpression, {
        callee: {
          object: {
            type: 'Identifier',
            name: refName,
          },
          property: {
            type: 'Identifier',
            name: 'getDOMNode',
          },
        },
      })
      .forEach(callPath => j(callPath).replaceWith(
        createReactFindDOMNodeCall(j.identifier(refName))
      ));
  };

  const updateToFindDOMNode = classPath => {
    var sum = 0;

    // this.getDOMNode()
    sum += j(classPath)
      .find(j.CallExpression, {
        callee: {
          object: {
            type: 'ThisExpression',
          },
          property: {
            type: 'Identifier',
            name: 'getDOMNode',
          },
        },
      })
      .forEach(path => j(path).replaceWith(
        createReactFindDOMNodeCall(j.thisExpression())
      ))
      .size();

    // this.refs.xxx.getDOMNode() or this.refs.xxx.refs.yyy.getDOMNode()
    sum += j(classPath)
      .find(j.MemberExpression, {
        object: {
          type: 'MemberExpression',
          object: {
            type: 'MemberExpression',
            object: {
              type: 'ThisExpression',
            },
            property: {
              type: 'Identifier',
              name: 'refs',
            },
          },
        },
      })
      .closest(j.CallExpression)
      .filter(path => (
        path.value.callee.property &&
        path.value.callee.property.type === 'Identifier' &&
        path.value.callee.property.name === 'getDOMNode'
      ))
      .forEach(path => j(path).replaceWith(
        createReactFindDOMNodeCall(path.value.callee.object)
      ))
      .size();

    // someVariable.getDOMNode() wherre `someVariable = this.refs.xxx`
    sum += j(classPath)
      .findVariableDeclarators()
      .filter(path => {
        const init = path.value.init;
        const value = init && init.object;
        return (
          value &&
          value.type === 'MemberExpression' &&
          value.object &&
          value.object.type === 'ThisExpression' &&
          value.property &&
          value.property.type === 'Identifier' &&
          value.property.name === 'refs' &&
          init.property &&
          init.property.type === 'Identifier'
        );
      })
      .forEach(path => j(path)
        .closest(j.FunctionExpression)
        .forEach(fnPath => updateRefCall(fnPath, path.value.id.name))
      )
      .size();

    return sum > 0;
  };

  if (
    !options['explicit-require'] ||
    ReactUtils.hasReact(root)
  ) {
    const didTransform = ReactUtils
      .findReactCreateClass(root)
      .filter(updateToFindDOMNode)
      .size() > 0;

    if (didTransform) {
      return root.toSource(printOptions);
    }
  }

  return null;
}

module.exports = getDOMNodeToFindDOMNode;
