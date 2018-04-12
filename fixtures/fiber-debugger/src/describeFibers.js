let nextFiberID = 1;
const fiberIDMap = new WeakMap();

function getFiberUniqueID(fiber) {
  if (!fiberIDMap.has(fiber)) {
    fiberIDMap.set(fiber, nextFiberID++);
  }
  return fiberIDMap.get(fiber);
}

function getFriendlyTag(tag) {
  switch (tag) {
    case 0:
      return '[indeterminate]';
    case 1:
      return '[fn]';
    case 2:
      return '[class]';
    case 3:
      return '[root]';
    case 4:
      return '[portal]';
    case 5:
      return '[host]';
    case 6:
      return '[text]';
    case 7:
      return '[coroutine]';
    case 8:
      return '[handler]';
    case 9:
      return '[yield]';
    case 10:
      return '[frag]';
    default:
      throw new Error('Unknown tag.');
  }
}

function getFriendlyEffect(effectTag) {
  const effects = {
    1: 'Performed Work',
    2: 'Placement',
    4: 'Update',
    8: 'Deletion',
    16: 'Content reset',
    32: 'Callback',
    64: 'Err',
    128: 'Ref',
  };
  return Object.keys(effects)
    .filter(flag => flag & effectTag)
    .map(flag => effects[flag])
    .join(' & ');
}

export default function describeFibers(rootFiber, workInProgress) {
  let descriptions = {};
  function acknowledgeFiber(fiber) {
    if (!fiber) {
      return null;
    }
    if (!fiber.return && fiber.tag !== 3) {
      return null;
    }
    const id = getFiberUniqueID(fiber);
    if (descriptions[id]) {
      return id;
    }
    descriptions[id] = {};
    Object.assign(descriptions[id], {
      ...fiber,
      id: id,
      tag: getFriendlyTag(fiber.tag),
      effectTag: getFriendlyEffect(fiber.effectTag),
      type: fiber.type && '<' + (fiber.type.name || fiber.type) + '>',
      stateNode: `[${typeof fiber.stateNode}]`,
      return: acknowledgeFiber(fiber.return),
      child: acknowledgeFiber(fiber.child),
      sibling: acknowledgeFiber(fiber.sibling),
      nextEffect: acknowledgeFiber(fiber.nextEffect),
      firstEffect: acknowledgeFiber(fiber.firstEffect),
      lastEffect: acknowledgeFiber(fiber.lastEffect),
      alternate: acknowledgeFiber(fiber.alternate),
    });
    return id;
  }

  const rootID = acknowledgeFiber(rootFiber);
  const workInProgressID = acknowledgeFiber(workInProgress);

  let currentIDs = new Set();
  function markAsCurent(id) {
    currentIDs.add(id);
    const fiber = descriptions[id];
    if (fiber.sibling) {
      markAsCurent(fiber.sibling);
    }
    if (fiber.child) {
      markAsCurent(fiber.child);
    }
  }
  markAsCurent(rootID);

  return {
    descriptions,
    rootID,
    currentIDs: Array.from(currentIDs),
    workInProgressID,
  };
}
