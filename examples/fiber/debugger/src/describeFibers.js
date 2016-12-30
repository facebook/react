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
      return '[host]';
    case 5:
      return '[text]';
    case 6:
      return '[coroutine]';
    case 7:
      return '[handler]';
    case 8:
      return '[yield]';
    case 9:
      return '[frag]';
    default:
      throw new Error('Unknown tag.');
  }
}

export default function describeFibers(rootFiber, workInProgress) {
  let descriptions = {};
  function acknowledgeFiber(fiber) {
    if (!fiber) {
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
      type: (fiber.type && ('<' + (fiber.type.name || fiber.type) + '>')),
      stateNode: `[${typeof fiber.stateNode}]`,
      return: acknowledgeFiber(fiber.return),
      child: acknowledgeFiber(fiber.child),
      sibling: acknowledgeFiber(fiber.sibling),
      nextEffect: acknowledgeFiber(fiber.nextEffect),
      firstEffect: acknowledgeFiber(fiber.firstEffect),
      lastEffect: acknowledgeFiber(fiber.lastEffect),
      progressedChild: acknowledgeFiber(fiber.progressedChild),
      progressedFirstDeletion: acknowledgeFiber(fiber.progressedFirstDeletion),
      progressedLastDeletion: acknowledgeFiber(fiber.progressedLastDeletion),
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
    workInProgressID
  };
}
