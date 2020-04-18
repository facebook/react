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
      name === 'Batched' ||
      name === 'remainingExpirationTimeBeforeCommit' ||
      name === 'earliestRemainingTimeAfterCommit' ||
      // If it doesn't match one of the constant names, look for common patterns
      (name.endsWith('Time') &&
        name !== 'workInProgressRootLatestProcessedEventTime') ||
      name.endsWith('Time_opaque') ||
      name.endsWith('Level') ||
      name.endsWith('Level_opaque')
    );
  }

  function isExpirationTime(node) {
    switch (node.type) {
      case 'Identifier': {
        return isExpirationTimeName(node.name);
      }
      case 'MemberExpression': {
        if (
          node.object.type === 'Identifier' &&
          node.property.type === 'Identifier'
        ) {
          return isExpirationTimeName(node.property.name);
        }
        break;
      }
    }
    return false;
  }

  const isSameOrHigherPriority = j.identifier('isSameOrHigherPriority');
  const isSameExpirationTime = j.identifier('isSameExpirationTime');

  const root = j(file.source);

  root.find(j.BinaryExpression).forEach(path => {
    const left = path.node.left;
    const right = path.node.right;
    if (isExpirationTime(left) && isExpirationTime(right)) {
      let condition;
      switch (path.node.operator) {
        case '>':
          condition = j.unaryExpression(
            '!',
            j.callExpression(isSameOrHigherPriority, [right, left])
          );
          break;
        case '>=':
          condition = j.callExpression(isSameOrHigherPriority, [left, right]);
          break;
        case '<':
          condition = j.unaryExpression(
            '!',
            j.callExpression(isSameOrHigherPriority, [left, right])
          );
          break;
        case '<=':
          condition = j.callExpression(isSameOrHigherPriority, [right, left]);
          break;
        case '===':
          condition = j.callExpression(isSameExpirationTime, [left, right]);
          break;
        case '!==':
          condition = j.unaryExpression(
            '!',
            j.callExpression(isSameExpirationTime, [left, right])
          );
          break;
        default:
          return;
      }
      j(path).replaceWith(condition);
    }
  });

  return root.toSource();
}

module.exports = transformer;
module.exports.parser = 'flow';
