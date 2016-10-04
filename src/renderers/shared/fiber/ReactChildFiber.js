/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildFiber
 * @flow
 */

'use strict';

import type { ReactCoroutine, ReactYield } from 'ReactCoroutine';
import type { Fiber } from 'ReactFiber';
import type { PriorityLevel } from 'ReactPriorityLevel';

var REACT_ELEMENT_TYPE = require('ReactElementSymbol');
var {
  REACT_COROUTINE_TYPE,
  REACT_YIELD_TYPE,
} = require('ReactCoroutine');

var ReactFiber = require('ReactFiber');
var ReactPriorityLevel = require('ReactPriorityLevel');
var ReactReifiedYield = require('ReactReifiedYield');
var ReactTypeOfWork = require('ReactTypeOfWork');

var getIteratorFn = require('getIteratorFn');

const {
  cloneFiber,
  createFiberFromElement,
  createFiberFromFragment,
  createFiberFromText,
  createFiberFromCoroutine,
  createFiberFromYield,
} = ReactFiber;

const {
  createReifiedYield,
  createUpdatedReifiedYield,
} = ReactReifiedYield;

const isArray = Array.isArray;

const {
  HostText,
  CoroutineComponent,
  YieldComponent,
  Fragment,
} = ReactTypeOfWork;

const {
  NoWork,
} = ReactPriorityLevel;

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.
function ChildReconciler(shouldClone, shouldTrackSideEffects) {

  function deleteChild(
    returnFiber : Fiber,
    childToDelete : Fiber
  ) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }

    // TODO: Add this child to the side-effect queue for deletion.
  }

  function deleteRemainingChildren(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber
  ) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    }
    // TODO: Add these children to the side-effect queue for deletion.
    return null;
  }

  function mapAndDeleteRemainingChildren(
    returnFiber : Fiber,
    currentFirstChild : Fiber
  ) : Map<string, Fiber> {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. At the same time, we'll flag them all for deletion. However,
    // we will then undo the deletion as we restore children. Implicit (null) keys
    // don't get added to this set.
    const existingChildren : Map<string, Fiber> = new Map();
    let existingChild = currentFirstChild;
    while (existingChild) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      }
      // Add everything to the delete queue
      // Actually... It is not possible to delete things from the queue since
      // we don't have access to the previous link. Does that mean we need a
      // second pass to add them? We should be able to keep track of the
      // previous deletion as we're iterating through the list the next time.
      // That way we know which item to patch when we delete a deletion.
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function useFiber(fiber : Fiber, priority : PriorityLevel) {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    if (shouldClone) {
      const clone = cloneFiber(fiber, priority);
      clone.index = 0;
      clone.sibling = null;
      return clone;
    } else {
      if (fiber.pendingWorkPriority === NoWork ||
          fiber.pendingWorkPriority > priority) {
        fiber.pendingWorkPriority = priority;
      }
      fiber.index = 0;
      fiber.sibling = null;
      return fiber;
    }
  }

  function placeChild(newFiber : Fiber, lastPlacedIndex : number, newIndex : number) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        // TODO: Schedule a move side-effect for this child.
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      // TODO: Schedule an insertion side-effect for this child.
      return lastPlacedIndex;
    }
  }

  function updateTextNode(
    returnFiber : Fiber,
    current : ?Fiber,
    textContent : string,
    priority : PriorityLevel
  ) {
    if (current == null || current.tag !== HostText) {
      // Insert
      const created = createFiberFromText(textContent, priority);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      const existing = useFiber(current, priority);
      existing.pendingProps = textContent;
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(
    returnFiber : Fiber,
    current : ?Fiber,
    element : ReactElement<any>,
    priority : PriorityLevel
  ) {
    if (current == null || current.type !== element.type) {
      // Insert
      const created = createFiberFromElement(element, priority);
      created.return = returnFiber;
      return created;
    } else {
      // Move based on index, TODO: This needs to restore a deletion marking.
      const existing = useFiber(current, priority);
      existing.pendingProps = element.props;
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateCoroutine(
    returnFiber : Fiber,
    current : ?Fiber,
    coroutine : ReactCoroutine,
    priority : PriorityLevel
  ) {
    // TODO: Should this also compare handler to determine whether to reuse?
    if (current == null || current.tag !== CoroutineComponent) {
      // Insert
      const created = createFiberFromCoroutine(coroutine, priority);
      created.return = returnFiber;
      return created;
    } else {
      // Move based on index, TODO: This needs to restore a deletion marking.
      const existing = useFiber(current, priority);
      existing.pendingProps = coroutine;
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateYield(
    returnFiber : Fiber,
    current : ?Fiber,
    yieldNode : ReactYield,
    priority : PriorityLevel
  ) {
    // TODO: Should this also compare continuation to determine whether to reuse?
    if (current == null || current.tag !== YieldComponent) {
      // Insert
      const reifiedYield = createReifiedYield(yieldNode);
      const created = createFiberFromYield(yieldNode, priority);
      created.output = reifiedYield;
      created.return = returnFiber;
      return created;
    } else {
      // Move based on index, TODO: This needs to restore a deletion marking.
      const existing = useFiber(current, priority);
      existing.output = createUpdatedReifiedYield(
        current.output,
        yieldNode
      );
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFragment(
    returnFiber : Fiber,
    current : ?Fiber,
    fragment : Iterable<*>,
    priority : PriorityLevel
  ) {
    if (current == null || current.tag !== Fragment) {
      // Insert
      const created = createFiberFromFragment(fragment, priority);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      const existing = useFiber(current, priority);
      existing.pendingProps = fragment;
      existing.return = returnFiber;
      return existing;
    }
  }

  function createChild(
    returnFiber : Fiber,
    newChild : any,
    priority : PriorityLevel
  ) : ?Fiber {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      const created = createFiberFromText('' + newChild, priority);
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild, priority);
          created.return = returnFiber;
          return created;
        }

        case REACT_COROUTINE_TYPE: {
          const created = createFiberFromCoroutine(newChild, priority);
          created.return = returnFiber;
          return created;
        }

        case REACT_YIELD_TYPE: {
          const reifiedYield = createReifiedYield(newChild);
          const created = createFiberFromYield(newChild, priority);
          created.output = reifiedYield;
          created.return = returnFiber;
          return created;
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        const created = createFiberFromFragment(newChild, priority);
        created.return = returnFiber;
        return created;
      }
    }

    return null;
  }

  function updateSlot(
    returnFiber : Fiber,
    oldFiber : ?Fiber,
    newChild : any,
    priority : PriorityLevel
  ) : ?Fiber {
    // Update the fiber if the keys match, otherwise return null.

    const key = oldFiber ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, '' + newChild, priority);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            return updateElement(
              returnFiber,
              oldFiber,
              newChild,
              priority
            );
          } else {
            return null;
          }
        }

        case REACT_COROUTINE_TYPE: {
          if (newChild.key === key) {
            return updateCoroutine(
              returnFiber,
              oldFiber,
              newChild,
              priority
            );
          } else {
            return null;
          }
        }

        case REACT_YIELD_TYPE: {
          if (newChild.key === key) {
            return updateYield(
              returnFiber,
              oldFiber,
              newChild,
              priority
            );
          } else {
            return null;
          }
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        // Fragments doesn't have keys so if the previous key is implicit we can
        // update it.
        if (key !== null) {
          return null;
        }
        return updateFragment(returnFiber, oldFiber, newChild, priority);
      }
    }

    return null;
  }

  function updateFromMap(
    existingChildren : Map<string, Fiber>,
    returnFiber : Fiber,
    oldFiber : ?Fiber,
    newChild : any,
    priority : PriorityLevel
  ) : ?Fiber {

    // TODO: If this child matches, we need to undo the deletion. However,
    // we don't do that for the updateSlot case because nothing was deleted yet.

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes doesn't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      return updateTextNode(returnFiber, oldFiber, '' + newChild, priority);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === null) {
            // For implicit keys, we'll use the existing fiber in this slot
            // but only if it also is an implicit key.
            return updateElement(
              returnFiber,
              oldFiber && oldFiber.key === null ? oldFiber : null,
              newChild,
              priority
            );
          } else {
            // For explicit keys we look for an existing fiber in the map.
            // TODO: We could test oldFiber.key first incase it happens to be
            // the same key but it might not be worth it given the likelihood.
            const matchedFiber = existingChildren.get(newChild.key);
            return updateElement(
              returnFiber,
              matchedFiber ? matchedFiber : null,
              newChild,
              priority
            );
          }
        }

        case REACT_COROUTINE_TYPE: {
          if (newChild.key === null) {
            // For implicit keys, we'll use the existing fiber in this slot
            // but only if it also is an implicit key.
            return updateCoroutine(
              returnFiber,
              oldFiber && oldFiber.key === null ? oldFiber : null,
              newChild,
              priority
            );
          } else {
            // For explicit keys we look for an existing fiber in the map.
            // TODO: We could test oldFiber.key first incase it happens to be
            // the same key but it might not be worth it given the likelihood.
            const matchedFiber = existingChildren.get(newChild.key);
            return updateCoroutine(
              returnFiber,
              matchedFiber ? matchedFiber : null,
              newChild,
              priority
            );
          }
        }

        case REACT_YIELD_TYPE: {
          if (newChild.key === null) {
            // For implicit keys, we'll use the existing fiber in this slot
            // but only if it also is an implicit key.
            return updateYield(
              returnFiber,
              oldFiber && oldFiber.key === null ? oldFiber : null,
              newChild,
              priority
            );
          } else {
            // For explicit keys we look for an existing fiber in the map.
            // TODO: We could test oldFiber.key first incase it happens to be
            // the same key but it might not be worth it given the likelihood.
            const matchedFiber = existingChildren.get(newChild.key);
            return updateYield(
              returnFiber,
              matchedFiber ? matchedFiber : null,
              newChild,
              priority
            );
          }
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        // Fragments doesn't have keys so if the previous is a fragment, we
        // update it.
        return updateFragment(returnFiber, oldFiber, newChild, priority);
      }
    }

    return null;
  }

  function reconcileChildrenArray(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    newChildren : Array<*>,
    priority : PriorityLevel) {

    // This algorithm can't optimize by searching from boths ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.

    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.

    // In this first iteration, we'll just live with hitting the bad case
    // (adding everything to a Map) in for every insert/move.

    let resultingFirstChild : ?Fiber = null;
    let previousNewFiber : ?Fiber = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    for (; oldFiber && newIdx < newChildren.length; newIdx++) {
      if (oldFiber) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }
      }
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        priority
      );
      if (!newFiber) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        break;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (!previousNewFiber) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (!oldFiber) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(
          returnFiber,
          newChildren[newIdx],
          priority
        );
        if (!newFiber) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (!previousNewFiber) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // Mark all children as deleted and add them to a key map for quick lookups.
    const existingChildren = mapAndDeleteRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; newIdx < newChildren.length; newIdx++) {
      // TODO: Since the mutation of existing fibers can happen at any order
      // we might break the link before we're done with it. :(
      if (oldFiber) {
        if (oldFiber.index > newIdx) {
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          nextOldFiber = oldFiber.sibling;
        }
      }
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        priority
      );
      if (newFiber) {
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (!previousNewFiber) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      // We will keep traversing the oldFiber in order, in case the new child
      // has a null key that we'll need to match in the same slot.
      oldFiber = nextOldFiber;
    }

    // TODO: Add deletion side-effects to the returnFiber's side-effects.

    return resultingFirstChild;
  }

  function reconcileChildrenIterator(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    newChildren : Iterator<*>,
    priority : PriorityLevel) {
    // TODO: Copy everything from reconcileChildrenArray but use the iterator
    // instead.
    return null;
  }

  function reconcileSingleTextNode(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    textContent : string,
    priority : PriorityLevel
  ) {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, priority);
      existing.pendingProps = textContent;
      existing.return = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText(textContent, priority);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleElement(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    element : ReactElement<any>,
    priority : PriorityLevel
  ) {
    const key = element.key;
    let child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, priority);
          existing.pendingProps = element.props;
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    const created = createFiberFromElement(element, priority);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleCoroutine(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    coroutine : ReactCoroutine,
    priority : PriorityLevel
  ) {
    const key = coroutine.key;
    let child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === CoroutineComponent) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, priority);
          existing.pendingProps = coroutine;
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    const created = createFiberFromCoroutine(coroutine, priority);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleYield(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    yieldNode : ReactYield,
    priority : PriorityLevel
  ) {
    const key = yieldNode.key;
    let child = currentFirstChild;
    while (child) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === YieldComponent) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, priority);
          existing.output = createUpdatedReifiedYield(
            child.output,
            yieldNode
          );
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    const reifiedYield = createReifiedYield(yieldNode);
    const created = createFiberFromYield(yieldNode, priority);
    created.output = reifiedYield;
    created.return = returnFiber;
    return created;
  }

  // TODO: This API will tag the children with the side-effect of the
  // reconciliation itself. Deletes have to get added to the side-effect list
  // of the return fiber right now. Other side-effects will be added as we
  // pass through those children.
  function reconcileChildFibers(
    returnFiber : Fiber,
    currentFirstChild : ?Fiber,
    newChild : any,
    priority : PriorityLevel
  ) : ?Fiber {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return reconcileSingleTextNode(
        returnFiber,
        currentFirstChild,
        '' + newChild,
        priority
      );
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            priority
          );

        case REACT_COROUTINE_TYPE:
          return reconcileSingleCoroutine(
            returnFiber,
            currentFirstChild,
            newChild,
            priority
          );

        case REACT_YIELD_TYPE:
          return reconcileSingleYield(
            returnFiber,
            currentFirstChild,
            newChild,
            priority
          );
      }

      if (isArray(newChild)) {
        return reconcileChildrenArray(
          returnFiber,
          currentFirstChild,
          newChild,
          priority
        );
      }

      const iteratorFn = getIteratorFn(newChild);
      if (iteratorFn) {
        return reconcileChildrenIterator(
          returnFiber,
          currentFirstChild,
          newChild,
          priority
        );
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

exports.reconcileChildFibers = ChildReconciler(true, true);

exports.reconcileChildFibersInPlace = ChildReconciler(false, true);

exports.mountChildFibersInPlace = ChildReconciler(false, false);

exports.cloneChildFibers = function(current : ?Fiber, workInProgress : Fiber) {
  if (!workInProgress.child) {
    return;
  }
  if (current && workInProgress.child === current.child) {
    // We use workInProgress.child since that lets Flow know that it can't be
    // null since we validated that already. However, as the line above suggests
    // they're actually the same thing.
    let currentChild = workInProgress.child;
    // TODO: This used to reset the pending priority. Not sure if that is needed.
    // workInProgress.pendingWorkPriority = current.pendingWorkPriority;
    // TODO: The below priority used to be set to NoWork which would've
    // dropped work. This is currently unobservable but will become
    // observable when the first sibling has lower priority work remaining
    // than the next sibling. At that point we should add tests that catches
    // this.
    let newChild = cloneFiber(currentChild, currentChild.pendingWorkPriority);
    workInProgress.child = newChild;

    newChild.return = workInProgress;
    while (currentChild.sibling) {
      currentChild = currentChild.sibling;
      newChild = newChild.sibling = cloneFiber(
        currentChild,
        currentChild.pendingWorkPriority
      );
      newChild.return = workInProgress;
    }
    newChild.sibling = null;
  }

  // If there is no alternate, then we don't need to clone the children.
  // If the children of the alternate fiber is a different set, then we don't
  // need to clone. We need to reset the return fiber though since we'll
  // traverse down into them.
  let child = workInProgress.child;
  while (child) {
    child.return = workInProgress;
    child = child.sibling;
  }
};
