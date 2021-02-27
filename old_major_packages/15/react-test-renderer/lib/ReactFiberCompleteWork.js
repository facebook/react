/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _require = require('./ReactChildFiber'),
    reconcileChildFibers = _require.reconcileChildFibers;

var ReactTypeOfWork = require('./ReactTypeOfWork');
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent,
    FunctionalComponent = ReactTypeOfWork.FunctionalComponent,
    ClassComponent = ReactTypeOfWork.ClassComponent,
    HostContainer = ReactTypeOfWork.HostContainer,
    HostComponent = ReactTypeOfWork.HostComponent,
    CoroutineComponent = ReactTypeOfWork.CoroutineComponent,
    CoroutineHandlerPhase = ReactTypeOfWork.CoroutineHandlerPhase,
    YieldComponent = ReactTypeOfWork.YieldComponent;


module.exports = function (config) {
  var createInstance = config.createInstance;
  var prepareUpdate = config.prepareUpdate;

  function markForPreEffect(workInProgress) {
    // Schedule a side-effect on this fiber, BEFORE the children's side-effects.
    if (workInProgress.firstEffect) {
      workInProgress.nextEffect = workInProgress.firstEffect;
      workInProgress.firstEffect = workInProgress;
    } else {
      workInProgress.firstEffect = workInProgress;
      workInProgress.lastEffect = workInProgress;
    }
  }

  // TODO: It's possible this will create layout thrash issues because mutations
  // of the DOM and life-cycles are interleaved. E.g. if a componentDidMount
  // of a sibling reads, then the next sibling updates and reads etc.
  function markForPostEffect(workInProgress) {
    // Schedule a side-effect on this fiber, AFTER the children's side-effects.
    if (workInProgress.lastEffect) {
      workInProgress.lastEffect.nextEffect = workInProgress;
    } else {
      workInProgress.firstEffect = workInProgress;
    }
    workInProgress.lastEffect = workInProgress;
  }

  function transferOutput(child, returnFiber) {
    // If we have a single result, we just pass that through as the output to
    // avoid unnecessary traversal. When we have multiple output, we just pass
    // the linked list of fibers that has the individual output values.
    returnFiber.output = child && !child.sibling ? child.output : child;
    returnFiber.memoizedProps = returnFiber.pendingProps;
  }

  function recursivelyFillYields(yields, output) {
    if (!output) {
      // Ignore nulls etc.
    } else if (output.tag !== undefined) {
      // TODO: Fix this fragile duck test.
      // Detect if this is a fiber, if so it is a fragment result.
      // $FlowFixMe: Refinement issue.
      var item = output;
      do {
        recursivelyFillYields(yields, item.output);
        item = item.sibling;
      } while (item);
    } else {
      // $FlowFixMe: Refinement issue. If it is not a Fiber or null, it is a yield
      yields.push(output);
    }
  }

  function moveCoroutineToHandlerPhase(current, workInProgress) {
    var coroutine = workInProgress.pendingProps;
    if (!coroutine) {
      throw new Error('Should be resolved by now');
    }

    // First step of the coroutine has completed. Now we need to do the second.
    // TODO: It would be nice to have a multi stage coroutine represented by a
    // single component, or at least tail call optimize nested ones. Currently
    // that requires additional fields that we don't want to add to the fiber.
    // So this requires nested handlers.
    // Note: This doesn't mutate the alternate node. I don't think it needs to
    // since this stage is reset for every pass.
    workInProgress.tag = CoroutineHandlerPhase;

    // Build up the yields.
    // TODO: Compare this to a generator or opaque helpers like Children.
    var yields = [];
    var child = workInProgress.child;
    while (child) {
      recursivelyFillYields(yields, child.output);
      child = child.sibling;
    }
    var fn = coroutine.handler;
    var props = coroutine.props;
    var nextChildren = fn(props, yields);

    var currentFirstChild = current ? current.stateNode : null;
    // Inherit the priority of the returnFiber.
    var priority = workInProgress.pendingWorkPriority;
    workInProgress.stateNode = reconcileChildFibers(workInProgress, currentFirstChild, nextChildren, priority);
    return workInProgress.stateNode;
  }

  function completeWork(current, workInProgress) {
    switch (workInProgress.tag) {
      case FunctionalComponent:
        transferOutput(workInProgress.child, workInProgress);
        return null;
      case ClassComponent:
        transferOutput(workInProgress.child, workInProgress);
        // Don't use the state queue to compute the memoized state. We already
        // merged it and assigned it to the instance. Transfer it from there.
        // Also need to transfer the props, because pendingProps will be null
        // in the case of an update
        var _workInProgress$state = workInProgress.stateNode,
            state = _workInProgress$state.state,
            props = _workInProgress$state.props;

        workInProgress.memoizedState = state;
        workInProgress.memoizedProps = props;
        // Transfer update queue to callbackList field so callbacks can be
        // called during commit phase.
        workInProgress.callbackList = workInProgress.updateQueue;
        markForPostEffect(workInProgress);
        return null;
      case HostContainer:
        transferOutput(workInProgress.child, workInProgress);
        // We don't know if a container has updated any children so we always
        // need to update it right now. We schedule this side-effect before
        // all the other side-effects in the subtree. We need to schedule it
        // before so that the entire tree is up-to-date before the life-cycles
        // are invoked.
        markForPreEffect(workInProgress);
        return null;
      case HostComponent:
        var newProps = workInProgress.pendingProps;
        var child = workInProgress.child;
        var children = child && !child.sibling ? child.output : child;
        if (current && workInProgress.stateNode != null) {
          // If we have an alternate, that means this is an update and we need to
          // schedule a side-effect to do the updates.
          var oldProps = current.memoizedProps;
          // If we get updated because one of our children updated, we don't
          // have newProps so we'll have to reuse them.
          // TODO: Split the update API as separate for the props vs. children.
          // Even better would be if children weren't special cased at all tho.
          if (!newProps) {
            newProps = oldProps;
          }
          var instance = workInProgress.stateNode;
          if (prepareUpdate(instance, oldProps, newProps, children)) {
            // This returns true if there was something to update.
            markForPreEffect(workInProgress);
          }
          // TODO: Is this actually ever going to change? Why set it every time?
          workInProgress.output = instance;
        } else {
          if (!newProps) {
            if (workInProgress.stateNode === null) {
              throw new Error('We must have new props for new mounts.');
            } else {
              // This can happen when we abort work.
              return null;
            }
          }
          var _instance = createInstance(workInProgress.type, newProps, children);
          // TODO: This seems like unnecessary duplication.
          workInProgress.stateNode = _instance;
          workInProgress.output = _instance;
        }
        workInProgress.memoizedProps = newProps;
        return null;
      case CoroutineComponent:
        return moveCoroutineToHandlerPhase(current, workInProgress);
      case CoroutineHandlerPhase:
        transferOutput(workInProgress.stateNode, workInProgress);
        // Reset the tag to now be a first phase coroutine.
        workInProgress.tag = CoroutineComponent;
        return null;
      case YieldComponent:
        // Does nothing.
        return null;
      // Error cases
      case IndeterminateComponent:
        throw new Error('An indeterminate component should have become determinate before completing.');
      default:
        throw new Error('Unknown unit of work tag');
    }
  }

  return {
    completeWork: completeWork
  };
};