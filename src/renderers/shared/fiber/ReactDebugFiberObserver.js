/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugFiberObserver
 * @flow
 */

if (__DEV__) {
  let listeners = [];
  let knownRoots = new Set();

  // TODO: this uses React DevTools data structure.
  // May want to redesign it to make more sense.
  function describeFiber(fiber) {
    let data = {
      type: fiber.type,
      key: fiber.key,
      ref: fiber.ref,
      source: fiber._debugSource,
      publicInstance: fiber.stateNode,
      children: [],
      props: null,
      state: null,
      context: null,
      updater: null,
      text: null
    };
    let child = fiber.child;
    while (child) {
      data.children.push(child._debugID);
      child = child.sibling;
    }
    switch (fiber.tag) {
      case 3:
        data.nodeType = 'Wrapper';
        break;
      case 1:
      case 2:
        data.nodeType = 'Composite';
        data.name = fiber.type.displayName || fiber.type.name;
        data.props = fiber.memoizedProps;
        data.state = fiber.memoizedState;
        data.publicInstance = fiber.stateNode;
        data.updater = {
          // TODO
          setState() {},
          forceUpdate() {},
          setInProps() {},
          setInState() {},
          setInContext() {},
        };
        break;
      case 5:
        data.nodeType = 'Native';
        data.name = fiber.type;
        data.props = fiber.memoizedProps;
        data.publicInstance = fiber.stateNode;
        if (
          typeof fiber.memoizedProps.children === 'string' ||
          typeof fiber.memoizedProps.children === 'number'
        ) {
          data.children = fiber.memoizedProps.children.toString();
        }
        break;
      case 6:
        data.nodeType = 'Text';
        data.text = fiber.memoizedProps;
        break;
      default:
        data.nodeType = 'Native';
        data.name = 'TODO_NOT_IMPLEMENTED_YET';
        break;
    }
    return data;
  }

  function mapChildren(parent, allKeys) {
    let children = new Map();
    let node = parent.child;
    while (node) {
      const key = node.key || node.index;
      allKeys.add(key);
      children.set(key, node);
      node = node.sibling;
    }
    return children;
  }

  function unmountFiber(fiber, messages) {
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      messages.push({
        type: 'unmount',
        id: node._debugID,
      });
      if (node == fiber) {
        return;
      }
      if (node.sibling) {
        node.sibling.return = node.return;
        node = node.sibling;
        continue;
      }
      while (node.return) {
        node = node.return;
        messages.push({
          type: 'unmount',
          id: node._debugID,
        });
        if (node == fiber) {
          return;
        }
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue outer;
        }
      }
      return;
    }
  }

  function mountFiber(fiber, messages) {
    let node = fiber;
    outer: while (true) {
      if (node.child) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      messages.push({
        type: 'mount',
        data: describeFiber(node),
        isRoot: node.tag === 3,
        id: node._debugID,
      });
      if (node == fiber) {
        return;
      }
      if (node.sibling) {
        node.sibling.return = node.return;
        node = node.sibling;
        continue;
      }
      while (node.return) {
        node = node.return;
        messages.push({
          type: 'mount',
          data: describeFiber(node),
          isRoot: node.tag === 3,
          id: node._debugID,
        });
        if (node == fiber) {
          return;
        }
        if (node.sibling) {
          node.sibling.return = node.return;
          node = node.sibling;
          continue outer;
        }
      }
      return;
    }
  }

  function updateFiber(nextFiber, prevFiber, messages) {
    let allKeys = new Set();
    let prevChildren = mapChildren(prevFiber, allKeys);
    let nextChildren = mapChildren(nextFiber, allKeys);
    allKeys.forEach(key => {
      const prevChild = prevChildren.get(key);
      const nextChild = nextChildren.get(key);
      if (prevChild && !nextChild) {
        unmountFiber(prevChild, messages);
      } else if (!prevChild && nextChild) {
        mountFiber(nextChild, messages);
      } else if (prevChild !== nextChild) {
        updateFiber(nextChild, prevChild, messages);
      }
    });
    messages.push({
      type: 'update',
      id: nextFiber._debugID,
      data: describeFiber(nextFiber),
    });
  }

  function sendMessages(listener, messages) {
    const {onMount, onUpdate, onUnmount} = listener;
    messages.forEach(message => {
      switch (message.type) {
        case 'mount':
          onMount(message.id, message.data, message.isRoot);
          break;
        case 'update':
          onUpdate(message.id, message.data);
          break;
        case 'unmount':
          onUnmount(message.id);
          break;
      }
    });
  }

  function notifyAllListeners(root) {
    let messages = [];
    const current = root.current;
    const previous = current.alternate;
    if (previous) {
      updateFiber(current, previous, messages);
    } else {
      mountFiber(current, messages)
    }
    listeners.forEach(listener => {
      try {
        sendMessages(listener, messages);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function hydrateNewListeners(root, newListeners) {
    let messages = [];
    mountFiber(root.current, messages);
    newListeners.forEach(listener => {
      try {
        sendMessages(listener, messages);
      } catch (err) {
        console.error(err);
      }
    });
  }

  exports.onCommitRoot = function onCommitRoot(root) {
    const isKnownRoot = knownRoots.has(root);
    if (root.memoizedProps !== null) {
      knownRoots.add(root);
    } else {
      knownRoots.delete(root);
    }
    if (listeners.length === 0) {
      return;
    }
    if (isKnownRoot) {
      notifyAllListeners(root);
    } else {
      hydrateNewListeners(root, listeners);
    }
  };

  exports.attach = function attach(listener) {
    listeners.push(listener);
    knownRoots.forEach(root => hydrateNewListeners(root, [listener]));
    return {
      unsubscribe() {
        listeners = listeners.filter(l => l !== listener);
      },
    };
  };


}
