'use strict';

function transformer(file, api) {
  const j = api.jscodeshift;

  function isExpirationTimeName(name) {
    return (
      name === 'NoWork' ||
      name === 'Never' ||
      name === 'Idle' ||
      name === 'ContinuousHydration' ||
      name === 'LongTransition' ||
      name === 'ShortTransition' ||
      name === 'DefaultUpdateTime' ||
      name === 'UserBlockingUpdateTime' ||
      name === 'Sync' ||
      name === 'Batched'
    );
  }

  const root = j(file.source);

  root.find(j.Identifier).forEach(path => {
    const name = path.node.name;
    if (isExpirationTimeName(name)) {
      const parentType = path.parent.node.type;
      if (
        parentType !== 'TypeCastExpression' &&
        parentType !== 'ImportSpecifier'
      ) {
        j(path).replaceWith(
          j.typeCastExpression(
            path.node,
            j.typeAnnotation(
              j.genericTypeAnnotation(
                j.identifier('ExpirationTimeOpaque'),
                null
              )
            )
          )
        );
      }
    }
  });

  return root.toSource();
}

module.exports = transformer;
module.exports.parser = 'flow';
