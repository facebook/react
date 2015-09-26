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

function removePureRenderMixin(file, api, options) {
  const j = api.jscodeshift;

  require('./utils/array-polyfills');
  const ReactUtils = require('./utils/ReactUtils')(j);

  const printOptions =
    options.printOptions || {quote: 'single', trailingComma: true};
  const root = j(file.source);

  const PURE_RENDER_MIXIN = options['mixin-name'] || 'PureRenderMixin';
  const SHOULD_COMPONENT_UPDATE = 'shouldComponentUpdate';
  const NEXT_PROPS = 'nextProps';
  const NEXT_STATE = 'nextState';

  // ---------------------------------------------------------------------------
  // shouldComponentUpdate
  const createShouldComponentUpdateFunction = () =>
    j.functionExpression(
      null,
      [j.identifier(NEXT_PROPS), j.identifier(NEXT_STATE)],
      j.blockStatement([
        j.returnStatement(
          j.callExpression(
            j.memberExpression(
              j.identifier('React'),
              j.memberExpression(
                j.identifier('addons'),
                j.identifier('shallowCompare'),
                false
              ),
              false
            ),
            [
              j.thisExpression(),
              j.identifier(NEXT_PROPS),
              j.identifier(NEXT_STATE),
            ]
          )
        ),
      ])
    );

  const createShouldComponentUpdateProperty = () =>
    j.property(
      'init',
      j.identifier(SHOULD_COMPONENT_UPDATE),
      createShouldComponentUpdateFunction()
    );

  const hasShouldComponentUpdate = classPath =>
    ReactUtils.getReactCreateClassSpec(classPath)
      .properties.every(property =>
        property.key.name !== SHOULD_COMPONENT_UPDATE
      );

  // ---------------------------------------------------------------------------
  // Mixin related code
  const isPureRenderMixin = node => (
    node.type === 'Identifier' &&
    node.name === PURE_RENDER_MIXIN
  );

  const hasPureRenderMixin = classPath => {
    const spec = ReactUtils.getReactCreateClassSpec(classPath);
    const mixin = spec && spec.properties.find(ReactUtils.isMixinProperty);
    return mixin && mixin.value.elements.some(isPureRenderMixin);
  };

  const removeMixin = elements =>
    j.property(
      'init',
      j.identifier('mixins'),
      j.arrayExpression(
        elements.filter(element => !isPureRenderMixin(element))
      )
    );

  // ---------------------------------------------------------------------------
  // Boom!
  const insertShouldComponentUpdate = properties => {
    const length = properties.length;
    const lastProp = properties[length - 1];
    // I wouldn't dare insert at the bottom if the last function is render
    if (
      lastProp.key.type === 'Identifier' &&
      lastProp.key.name === 'render'
    ) {
      properties.splice(
        length - 1,
        1,
        createShouldComponentUpdateProperty(),
        lastProp
      );
    } else {
      properties.push(createShouldComponentUpdateProperty());
    }
    return properties;
  };

  const cleanupReactComponent = classPath => {
    const spec = ReactUtils.getReactCreateClassSpec(classPath);
    const properties = spec.properties
      .map(property => {
        if (ReactUtils.isMixinProperty(property)) {
          const elements = property.value.elements;
          return (elements.length !== 1) ? removeMixin(elements) : null;
        }
        return property;
      })
      .filter(property => !!property);

    ReactUtils.findReactCreateClassCallExpression(classPath).replaceWith(
      ReactUtils.createCreateReactClassCallExpression(
        insertShouldComponentUpdate(properties)
      )
    );
  };

  // Remove it if only two or fewer are left:
  // var PureRenderMixin = React.addons.PureRenderMixin;
  const hasPureRenderIdentifiers = path =>
    path.find(j.Identifier, {
      name: PURE_RENDER_MIXIN,
    }).size() > 2;

  const deletePureRenderMixin = path => {
    if (hasPureRenderIdentifiers(path)) {
      return;
    }

    const declaration = path
      .findVariableDeclarators(PURE_RENDER_MIXIN)
      .closest(j.VariableDeclaration);

    if (declaration.size > 1) {
      declaration.forEach(p =>
        j(p).replaceWith(
          j.variableDeclaration(
            'var',
            p.value.declarations.filter(isPureRenderMixin)
          )
        )
      );
    } else {
      // Let's assume the variable declaration happens at the top level
      const program = declaration.closest(j.Program).get();
      const body = program.value.body;
      const index = body.indexOf(declaration.get().value);
      if (index !== -1) {
        body.splice(index, 1);
      }
    }
  };

  if (
    !options['explicit-require'] ||
    ReactUtils.hasReact(root)
  ) {
    const didTransform = ReactUtils
      .findReactCreateClass(root)
      .filter(hasPureRenderMixin)
      .filter(hasShouldComponentUpdate)
      .forEach(cleanupReactComponent)
      .size() > 0;

    if (didTransform) {
      deletePureRenderMixin(root);
      return root.toSource(printOptions);
    }
  }

  return null;
}

module.exports = removePureRenderMixin;
