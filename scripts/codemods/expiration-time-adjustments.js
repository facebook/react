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

  const root = j(file.source);

  const bumpPriorityLower = j.identifier('bumpPriorityLower');
  const bumpPriorityHigher = j.identifier('bumpPriorityHigher');

  root.find(j.BinaryExpression).forEach(path => {
    const left = path.node.left;
    const right = path.node.right;
    if (
      isExpirationTime(left) &&
      right.type === 'Literal' &&
      right.value === 1
    ) {
      switch (path.node.operator) {
        case '-':
          j(path).replaceWith(j.callExpression(bumpPriorityLower, [left]));
          return;
        case '+':
          j(path).replaceWith(j.callExpression(bumpPriorityHigher, [left]));
          return;
      }
    }
  });

  root.find(j.AssignmentExpression).forEach(path => {
    const left = path.node.left;
    const right = path.node.right;
    if (
      isExpirationTime(left) &&
      right.type === 'Literal' &&
      right.value === 1
    ) {
      switch (path.node.operator) {
        case '+=':
          j(path).replaceWith(
            j.assignmentExpression(
              '=',
              left,
              j.callExpression(bumpPriorityHigher, [left])
            )
          );
          return;
        case '-=':
          j(path).replaceWith(
            j.assignmentExpression(
              '=',
              left,
              j.callExpression(bumpPriorityLower, [left])
            )
          );
          return;
      }
    }
  });

  root.find(j.UpdateExpression).forEach(path => {
    const argument = path.node.argument;
    if (isExpirationTime(argument)) {
      switch (path.node.operator) {
        case '++':
          j(path).replaceWith(
            j.assignmentExpression(
              '=',
              argument,
              j.callExpression(bumpPriorityHigher, [argument])
            )
          );
          return;
        case '--':
          j(path).replaceWith(
            j.assignmentExpression(
              '=',
              argument,
              j.callExpression(bumpPriorityLower, [argument])
            )
          );
          return;
      }
    }
  });

  return root.toSource();
}

module.exports = transformer;
module.exports.parser = 'flow';
