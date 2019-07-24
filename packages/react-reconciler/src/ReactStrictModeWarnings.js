/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {getStackByFiberInDevAndProd} from './ReactCurrentFiber';

import getComponentName from 'shared/getComponentName';
import {StrictMode} from './ReactTypeOfMode';
import lowPriorityWarning from 'shared/lowPriorityWarning';
import warningWithoutStack from 'shared/warningWithoutStack';

type FiberArray = Array<Fiber>;
type FiberToFiberComponentsMap = Map<Fiber, FiberArray>;

const ReactStrictModeWarnings = {
  recordUnsafeLifecycleWarnings(fiber: Fiber, instance: any): void {},
  flushPendingUnsafeLifecycleWarnings(): void {},
  recordLegacyContextWarning(fiber: Fiber, instance: any): void {},
  flushLegacyContextWarning(): void {},
  discardPendingWarnings(): void {},
};

if (__DEV__) {
  const findStrictRoot = (fiber: Fiber): Fiber | null => {
    let maybeStrictRoot = null;

    let node = fiber;
    while (node !== null) {
      if (node.mode & StrictMode) {
        maybeStrictRoot = node;
      }
      node = node.return;
    }

    return maybeStrictRoot;
  };

  const setToSortedString = set => {
    const array = [];
    set.forEach(value => {
      array.push(value);
    });
    return array.sort().join(', ');
  };

  let pendingComponentWillMountWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillMountWarnings: Array<Fiber> = [];
  let pendingComponentWillReceivePropsWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillReceivePropsWarnings: Array<Fiber> = [];
  let pendingComponentWillUpdateWarnings: Array<Fiber> = [];
  let pendingUNSAFE_ComponentWillUpdateWarnings: Array<Fiber> = [];

  // Tracks components we have already warned about.
  const didWarnAboutUnsafeLifecycles = new Set();

  ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = (
    fiber: Fiber,
    instance: any,
  ) => {
    // Dedup strategy: Warn once per component.
    if (didWarnAboutUnsafeLifecycles.has(fiber.type)) {
      return;
    }

    if (
      typeof instance.componentWillMount === 'function' &&
      // Don't warn about react-lifecycles-compat polyfilled components.
      instance.componentWillMount.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillMountWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillMount === 'function'
    ) {
      pendingUNSAFE_ComponentWillMountWarnings.push(fiber);
    }

    if (
      typeof instance.componentWillReceiveProps === 'function' &&
      instance.componentWillReceiveProps.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillReceivePropsWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillReceiveProps === 'function'
    ) {
      pendingUNSAFE_ComponentWillReceivePropsWarnings.push(fiber);
    }

    if (
      typeof instance.componentWillUpdate === 'function' &&
      instance.componentWillUpdate.__suppressDeprecationWarning !== true
    ) {
      pendingComponentWillUpdateWarnings.push(fiber);
    }

    if (
      fiber.mode & StrictMode &&
      typeof instance.UNSAFE_componentWillUpdate === 'function'
    ) {
      pendingUNSAFE_ComponentWillUpdateWarnings.push(fiber);
    }
  };

  ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = () => {
    // We do an initial pass to gather component names
    const componentWillMountUniqueNames = new Set();
    if (pendingComponentWillMountWarnings.length > 0) {
      pendingComponentWillMountWarnings.forEach(fiber => {
        componentWillMountUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingComponentWillMountWarnings = [];
    }

    const UNSAFE_componentWillMountUniqueNames = new Set();
    if (pendingUNSAFE_ComponentWillMountWarnings.length > 0) {
      pendingUNSAFE_ComponentWillMountWarnings.forEach(fiber => {
        UNSAFE_componentWillMountUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });
      pendingUNSAFE_ComponentWillMountWarnings = [];
    }

    const componentWillReceivePropsUniqueNames = new Set();
    if (pendingComponentWillReceivePropsWarnings.length > 0) {
      pendingComponentWillReceivePropsWarnings.forEach(fiber => {
        componentWillReceivePropsUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });

      pendingComponentWillReceivePropsWarnings = [];
    }

    const UNSAFE_componentWillReceivePropsUniqueNames = new Set();
    if (pendingUNSAFE_ComponentWillReceivePropsWarnings.length > 0) {
      pendingUNSAFE_ComponentWillReceivePropsWarnings.forEach(fiber => {
        UNSAFE_componentWillReceivePropsUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });

      pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    }

    const componentWillUpdateUniqueNames = new Set();
    if (pendingComponentWillUpdateWarnings.length > 0) {
      pendingComponentWillUpdateWarnings.forEach(fiber => {
        componentWillUpdateUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });

      pendingComponentWillUpdateWarnings = [];
    }

    const UNSAFE_componentWillUpdateUniqueNames = new Set();
    if (pendingUNSAFE_ComponentWillUpdateWarnings.length > 0) {
      pendingUNSAFE_ComponentWillUpdateWarnings.forEach(fiber => {
        UNSAFE_componentWillUpdateUniqueNames.add(
          getComponentName(fiber.type) || 'Component',
        );
        didWarnAboutUnsafeLifecycles.add(fiber.type);
      });

      pendingUNSAFE_ComponentWillUpdateWarnings = [];
    }

    // Finally, we flush all the warnings
    // UNSAFE_ ones before the deprecated ones, since they'll be 'louder'
    if (UNSAFE_componentWillMountUniqueNames.size > 0) {
      const sortedNames = setToSortedString(
        UNSAFE_componentWillMountUniqueNames,
      );
      warningWithoutStack(
        false,
        'Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move code with side effects to componentDidMount, and set initial state in the constructor.\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }

    if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
      const sortedNames = setToSortedString(
        UNSAFE_componentWillReceivePropsUniqueNames,
      );
      warningWithoutStack(
        false,
        'Using UNSAFE_componentWillReceiveProps in strict mode is not recommended ' +
          'and may indicate bugs in your code. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move data fetching code or side effects to componentDidUpdate.\n' +
          "* If you're updating state whenever props change, " +
          'refactor your code to use memoization techniques or move it to ' +
          'static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }

    if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
      const sortedNames = setToSortedString(
        UNSAFE_componentWillUpdateUniqueNames,
      );
      warningWithoutStack(
        false,
        'Using UNSAFE_componentWillUpdate in strict mode is not recommended ' +
          'and may indicate bugs in your code. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move data fetching code or side effects to componentDidUpdate.\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }

    if (componentWillMountUniqueNames.size > 0) {
      const sortedNames = setToSortedString(componentWillMountUniqueNames);

      lowPriorityWarning(
        false,
        'componentWillMount has been renamed, and is not recommended for use. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move code with side effects to componentDidMount, and set initial state in the constructor.\n' +
          '* Rename componentWillMount to UNSAFE_componentWillMount to suppress ' +
          'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' +
          'To rename all deprecated lifecycles to their new names, you can run ' +
          '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }

    if (componentWillReceivePropsUniqueNames.size > 0) {
      const sortedNames = setToSortedString(
        componentWillReceivePropsUniqueNames,
      );

      lowPriorityWarning(
        false,
        'componentWillReceiveProps has been renamed, and is not recommended for use. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move data fetching code or side effects to componentDidUpdate.\n' +
          "* If you're updating state whenever props change, refactor your " +
          'code to use memoization techniques or move it to ' +
          'static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state\n' +
          '* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress ' +
          'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' +
          'To rename all deprecated lifecycles to their new names, you can run ' +
          '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }

    if (componentWillUpdateUniqueNames.size > 0) {
      const sortedNames = setToSortedString(componentWillUpdateUniqueNames);

      lowPriorityWarning(
        false,
        'componentWillUpdate has been renamed, and is not recommended for use. ' +
          'See https://fb.me/react-async-component-lifecycle-hooks for details.\n\n' +
          '* Move data fetching code or side effects to componentDidUpdate.\n' +
          '* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress ' +
          'this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. ' +
          'To rename all deprecated lifecycles to their new names, you can run ' +
          '`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n' +
          '\nPlease update the following components: %s',
        sortedNames,
      );
    }
  };

  let pendingLegacyContextWarning: FiberToFiberComponentsMap = new Map();

  // Tracks components we have already warned about.
  const didWarnAboutLegacyContext = new Set();

  ReactStrictModeWarnings.recordLegacyContextWarning = (
    fiber: Fiber,
    instance: any,
  ) => {
    const strictRoot = findStrictRoot(fiber);
    if (strictRoot === null) {
      warningWithoutStack(
        false,
        'Expected to find a StrictMode component in a strict mode tree. ' +
          'This error is likely caused by a bug in React. Please file an issue.',
      );
      return;
    }

    // Dedup strategy: Warn once per component.
    if (didWarnAboutLegacyContext.has(fiber.type)) {
      return;
    }

    let warningsForRoot = pendingLegacyContextWarning.get(strictRoot);

    if (
      fiber.type.contextTypes != null ||
      fiber.type.childContextTypes != null ||
      (instance !== null && typeof instance.getChildContext === 'function')
    ) {
      if (warningsForRoot === undefined) {
        warningsForRoot = [];
        pendingLegacyContextWarning.set(strictRoot, warningsForRoot);
      }
      warningsForRoot.push(fiber);
    }
  };

  ReactStrictModeWarnings.flushLegacyContextWarning = () => {
    ((pendingLegacyContextWarning: any): FiberToFiberComponentsMap).forEach(
      (fiberArray: FiberArray, strictRoot) => {
        const uniqueNames = new Set();
        fiberArray.forEach(fiber => {
          uniqueNames.add(getComponentName(fiber.type) || 'Component');
          didWarnAboutLegacyContext.add(fiber.type);
        });

        const sortedNames = setToSortedString(uniqueNames);
        const strictRootComponentStack = getStackByFiberInDevAndProd(
          strictRoot,
        );

        warningWithoutStack(
          false,
          'Legacy context API has been detected within a strict-mode tree: %s' +
            '\n\nThe old API will be supported in all 16.x releases, but applications ' +
            'using it should migrate to the new version.' +
            '\n\nPlease update the following components: %s' +
            '\n\nLearn more about this warning here:' +
            '\nhttps://fb.me/react-legacy-context',
          strictRootComponentStack,
          sortedNames,
        );
      },
    );
  };

  ReactStrictModeWarnings.discardPendingWarnings = () => {
    pendingComponentWillMountWarnings = [];
    pendingUNSAFE_ComponentWillMountWarnings = [];
    pendingComponentWillReceivePropsWarnings = [];
    pendingUNSAFE_ComponentWillReceivePropsWarnings = [];
    pendingComponentWillUpdateWarnings = [];
    pendingUNSAFE_ComponentWillUpdateWarnings = [];
    pendingLegacyContextWarning = new Map();
  };
}

export default ReactStrictModeWarnings;
