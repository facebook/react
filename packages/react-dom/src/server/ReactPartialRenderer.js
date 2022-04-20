/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ThreadID} from './ReactThreadIDAllocator';
import type {ReactElement} from 'shared/ReactElementType';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {ReactProvider, ReactContext} from 'shared/ReactTypes';

import * as React from 'react';
import isArray from 'shared/isArray';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import {describeUnknownElementTypeFrameInDEV} from 'shared/ReactComponentStackFrame';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  warnAboutDeprecatedLifecycles,
  disableLegacyContext,
  disableModulePatternComponents,
  enableScopeAPI,
} from 'shared/ReactFeatureFlags';
import {
  checkPropStringCoercion,
  checkFormFieldValueStringCoercion,
} from 'shared/CheckStringCoercion';

import {
  REACT_DEBUG_TRACING_MODE_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_SCOPE_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
} from 'shared/ReactSymbols';

import {
  emptyObject,
  processContext,
  validateContextBounds,
} from './ReactPartialRendererContext';
import {allocThreadID, freeThreadID} from './ReactThreadIDAllocator';
import {
  createMarkupForCustomAttribute,
  createMarkupForProperty,
} from './DOMMarkupOperations';
import escapeTextForBrowser from './escapeTextForBrowser';
import {
  prepareToUseHooks,
  finishHooks,
  resetHooksState,
  Dispatcher,
  currentPartialRenderer,
  setCurrentPartialRenderer,
} from './ReactPartialRendererHooks';
import {
  HTML_NAMESPACE,
  getIntrinsicNamespace,
  getChildNamespace,
} from '../shared/DOMNamespaces';
import {checkControlledValueProps} from '../shared/ReactControlledValuePropTypes';
import assertValidProps from '../shared/assertValidProps';
import dangerousStyleValue from '../shared/dangerousStyleValue';
import hyphenateStyleName from '../shared/hyphenateStyleName';
import isCustomComponentFn from '../shared/isCustomComponent';
import omittedCloseTags from '../shared/omittedCloseTags';
import warnValidStyle from '../shared/warnValidStyle';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
import assign from 'shared/assign';
import hasOwnProperty from 'shared/hasOwnProperty';

// Based on reading the React.Children implementation. TODO: type this somewhere?
type ReactNode = string | number | ReactElement;
type FlatReactChildren = Array<null | ReactNode>;
type toArrayType = (children: mixed) => FlatReactChildren;
const toArray = ((React.Children.toArray: any): toArrayType);

// This is only used in DEV.
// Each entry is `this.stack` from a currently executing renderer instance.
// (There may be more than one because ReactDOMServer is reentrant).
// Each stack is an array of frames which may contain nested stacks of elements.
const currentDebugStacks = [];

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
let ReactDebugCurrentFrame;
let prevGetCurrentStackImpl = null;
let getCurrentServerStackImpl = () => '';
let describeStackFrame = element => '';

let validatePropertiesInDevelopment = (type, props) => {};
let pushCurrentDebugStack = (stack: Array<Frame>) => {};
let pushElementToDebugStack = (element: ReactElement) => {};
let popCurrentDebugStack = () => {};
let hasWarnedAboutUsingContextAsConsumer = false;

if (__DEV__) {
  ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

  validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props, null);
  };

  describeStackFrame = function(element): string {
    return describeUnknownElementTypeFrameInDEV(
      element.type,
      element._source,
      null,
    );
  };

  pushCurrentDebugStack = function(stack: Array<Frame>) {
    currentDebugStacks.push(stack);

    if (currentDebugStacks.length === 1) {
      // We are entering a server renderer.
      // Remember the previous (e.g. client) global stack implementation.
      prevGetCurrentStackImpl = ReactDebugCurrentFrame.getCurrentStack;
      ReactDebugCurrentFrame.getCurrentStack = getCurrentServerStackImpl;
    }
  };

  pushElementToDebugStack = function(element: ReactElement) {
    // For the innermost executing ReactDOMServer call,
    const stack = currentDebugStacks[currentDebugStacks.length - 1];
    // Take the innermost executing frame (e.g. <Foo>),
    const frame: Frame = stack[stack.length - 1];
    // and record that it has one more element associated with it.
    ((frame: any): FrameDev).debugElementStack.push(element);
    // We only need this because we tail-optimize single-element
    // children and directly handle them in an inner loop instead of
    // creating separate frames for them.
  };

  popCurrentDebugStack = function() {
    currentDebugStacks.pop();

    if (currentDebugStacks.length === 0) {
      // We are exiting the server renderer.
      // Restore the previous (e.g. client) global stack implementation.
      ReactDebugCurrentFrame.getCurrentStack = prevGetCurrentStackImpl;
      prevGetCurrentStackImpl = null;
    }
  };

  getCurrentServerStackImpl = function(): string {
    if (currentDebugStacks.length === 0) {
      // Nothing is currently rendering.
      return '';
    }
    // ReactDOMServer is reentrant so there may be multiple calls at the same time.
    // Take the frames from the innermost call which is the last in the array.
    const frames = currentDebugStacks[currentDebugStacks.length - 1];
    let stack = '';
    // Go through every frame in the stack from the innermost one.
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame: Frame = frames[i];
      // Every frame might have more than one debug element stack entry associated with it.
      // This is because single-child nesting doesn't create materialized frames.
      // Instead it would push them through `pushElementToDebugStack()`.
      const debugElementStack = ((frame: any): FrameDev).debugElementStack;
      for (let ii = debugElementStack.length - 1; ii >= 0; ii--) {
        stack += describeStackFrame(debugElementStack[ii]);
      }
    }
    return stack;
  };
}

let didWarnDefaultInputValue = false;
let didWarnDefaultChecked = false;
let didWarnDefaultSelectValue = false;
let didWarnDefaultTextareaValue = false;
let didWarnInvalidOptionChildren = false;
let didWarnInvalidOptionInnerHTML = false;
const didWarnAboutNoopUpdateForComponent = {};
const didWarnAboutBadClass = {};
const didWarnAboutModulePatternComponent = {};
const didWarnAboutDeprecatedWillMount = {};
const didWarnAboutUndefinedDerivedState = {};
const didWarnAboutUninitializedState = {};
const didWarnAboutLegacyLifecyclesAndDerivedState = {};
const valuePropNames = ['value', 'defaultValue'];
const newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true,
};

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name
const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
const validatedTagCache = {};
function validateDangerousTag(tag) {
  if (!validatedTagCache.hasOwnProperty(tag)) {
    if (!VALID_TAG_REGEX.test(tag)) {
      throw new Error(`Invalid tag: ${tag}`);
    }

    validatedTagCache[tag] = true;
  }
}

const styleNameCache = {};
const processStyleName = function(styleName) {
  if (styleNameCache.hasOwnProperty(styleName)) {
    return styleNameCache[styleName];
  }
  const result = hyphenateStyleName(styleName);
  styleNameCache[styleName] = result;
  return result;
};

function createMarkupForStyles(styles): string | null {
  let serialized = '';
  let delimiter = '';
  for (const styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    const isCustomProperty = styleName.indexOf('--') === 0;
    const styleValue = styles[styleName];
    if (__DEV__) {
      if (!isCustomProperty) {
        warnValidStyle(styleName, styleValue);
      }
    }
    if (styleValue != null) {
      serialized +=
        delimiter +
        (isCustomProperty ? styleName : processStyleName(styleName)) +
        ':';
      serialized += dangerousStyleValue(
        styleName,
        styleValue,
        isCustomProperty,
      );

      delimiter = ';';
    }
  }
  return serialized || null;
}

function warnNoop(
  publicInstance: React$Component<any, any>,
  callerName: string,
) {
  if (__DEV__) {
    const constructor = publicInstance.constructor;
    const componentName =
      (constructor && getComponentNameFromType(constructor)) || 'ReactClass';
    const warningKey = componentName + '.' + callerName;
    if (didWarnAboutNoopUpdateForComponent[warningKey]) {
      return;
    }

    console.error(
      '%s(...): Can only update a mounting component. ' +
        'This usually means you called %s() outside componentWillMount() on the server. ' +
        'This is a no-op.\n\nPlease check the code for the %s component.',
      callerName,
      callerName,
      componentName,
    );
    didWarnAboutNoopUpdateForComponent[warningKey] = true;
  }
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function getNonChildrenInnerMarkup(props) {
  const innerHTML = props.dangerouslySetInnerHTML;
  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    const content = props.children;
    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextForBrowser(content);
    }
  }
  return null;
}

function flattenTopLevelChildren(children: mixed): FlatReactChildren {
  if (!React.isValidElement(children)) {
    return toArray(children);
  }
  const element = ((children: any): ReactElement);
  if (element.type !== REACT_FRAGMENT_TYPE) {
    return [element];
  }
  const fragmentChildren = element.props.children;
  if (!React.isValidElement(fragmentChildren)) {
    return toArray(fragmentChildren);
  }
  const fragmentChildElement = ((fragmentChildren: any): ReactElement);
  return [fragmentChildElement];
}

function flattenOptionChildren(children: mixed): ?string {
  if (children === undefined || children === null) {
    return children;
  }
  let content = '';
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach((children: any), function(child) {
    if (child == null) {
      return;
    }
    content += (child: any);
    if (__DEV__) {
      if (
        !didWarnInvalidOptionChildren &&
        typeof child !== 'string' &&
        typeof child !== 'number'
      ) {
        didWarnInvalidOptionChildren = true;
        console.error(
          'Cannot infer the option value of complex children. ' +
            'Pass a `value` prop or use a plain string as children to <option>.',
        );
      }
    }
  });
  return content;
}

const STYLE = 'style';
const RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null,
  suppressHydrationWarning: null,
};

function createOpenTagMarkup(
  tagVerbatim: string,
  tagLowercase: string,
  props: Object,
  namespace: string,
  makeStaticMarkup: boolean,
  isRootElement: boolean,
): string {
  let ret = '<' + tagVerbatim;

  const isCustomComponent = isCustomComponentFn(tagLowercase, props);

  for (const propKey in props) {
    if (!hasOwnProperty.call(props, propKey)) {
      continue;
    }
    let propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    if (propKey === STYLE) {
      propValue = createMarkupForStyles(propValue);
    }
    let markup = null;
    if (isCustomComponent) {
      if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
        markup = createMarkupForCustomAttribute(propKey, propValue);
      }
    } else {
      markup = createMarkupForProperty(propKey, propValue);
    }
    if (markup) {
      ret += ' ' + markup;
    }
  }

  return ret;
}

function resolve(
  child: mixed,
  context: Object,
  threadID: ThreadID,
): {|
  child: mixed,
  context: Object,
|} {
  while (React.isValidElement(child)) {
    // Safe because we just checked it's an element.
    const element: ReactElement = (child: any);
    const Component = element.type;
    if (__DEV__) {
      pushElementToDebugStack(element);
    }
    if (typeof Component !== 'function') {
      break;
    }
    processChild(element, Component);
  }

  // Extra closure so queue and replace can be captured properly
  function processChild(element, Component) {
    const isClass = shouldConstruct(Component);
    const publicContext = processContext(Component, context, threadID, isClass);

    let queue = [];
    let replace = false;
    const updater = {
      isMounted: function(publicInstance) {
        return false;
      },
      enqueueForceUpdate: function(publicInstance) {
        if (queue === null) {
          warnNoop(publicInstance, 'forceUpdate');
          return null;
        }
      },
      enqueueReplaceState: function(publicInstance, completeState) {
        replace = true;
        queue = [completeState];
      },
      enqueueSetState: function(publicInstance, currentPartialState) {
        if (queue === null) {
          warnNoop(publicInstance, 'setState');
          return null;
        }
        queue.push(currentPartialState);
      },
    };

    let inst;
    if (isClass) {
      inst = new Component(element.props, publicContext, updater);

      if (typeof Component.getDerivedStateFromProps === 'function') {
        if (__DEV__) {
          if (inst.state === null || inst.state === undefined) {
            const componentName =
              getComponentNameFromType(Component) || 'Unknown';
            if (!didWarnAboutUninitializedState[componentName]) {
              console.error(
                '`%s` uses `getDerivedStateFromProps` but its initial state is ' +
                  '%s. This is not recommended. Instead, define the initial state by ' +
                  'assigning an object to `this.state` in the constructor of `%s`. ' +
                  'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.',
                componentName,
                inst.state === null ? 'null' : 'undefined',
                componentName,
              );
              didWarnAboutUninitializedState[componentName] = true;
            }
          }

          // If new component APIs are defined, "unsafe" lifecycles won't be called.
          // Warn about these lifecycles if they are present.
          // Don't warn about react-lifecycles-compat polyfilled methods though.
          if (
            typeof Component.getDerivedStateFromProps === 'function' ||
            typeof inst.getSnapshotBeforeUpdate === 'function'
          ) {
            let foundWillMountName = null;
            let foundWillReceivePropsName = null;
            let foundWillUpdateName = null;
            if (
              typeof inst.componentWillMount === 'function' &&
              inst.componentWillMount.__suppressDeprecationWarning !== true
            ) {
              foundWillMountName = 'componentWillMount';
            } else if (typeof inst.UNSAFE_componentWillMount === 'function') {
              foundWillMountName = 'UNSAFE_componentWillMount';
            }
            if (
              typeof inst.componentWillReceiveProps === 'function' &&
              inst.componentWillReceiveProps.__suppressDeprecationWarning !==
                true
            ) {
              foundWillReceivePropsName = 'componentWillReceiveProps';
            } else if (
              typeof inst.UNSAFE_componentWillReceiveProps === 'function'
            ) {
              foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
            }
            if (
              typeof inst.componentWillUpdate === 'function' &&
              inst.componentWillUpdate.__suppressDeprecationWarning !== true
            ) {
              foundWillUpdateName = 'componentWillUpdate';
            } else if (typeof inst.UNSAFE_componentWillUpdate === 'function') {
              foundWillUpdateName = 'UNSAFE_componentWillUpdate';
            }
            if (
              foundWillMountName !== null ||
              foundWillReceivePropsName !== null ||
              foundWillUpdateName !== null
            ) {
              const componentName =
                getComponentNameFromType(Component) || 'Component';
              const newApiName =
                typeof Component.getDerivedStateFromProps === 'function'
                  ? 'getDerivedStateFromProps()'
                  : 'getSnapshotBeforeUpdate()';
              if (!didWarnAboutLegacyLifecyclesAndDerivedState[componentName]) {
                didWarnAboutLegacyLifecyclesAndDerivedState[
                  componentName
                ] = true;
                console.error(
                  'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
                    '%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n' +
                    'The above lifecycles should be removed. Learn more about this warning here:\n' +
                    'https://reactjs.org/link/unsafe-component-lifecycles',
                  componentName,
                  newApiName,
                  foundWillMountName !== null
                    ? `\n  ${foundWillMountName}`
                    : '',
                  foundWillReceivePropsName !== null
                    ? `\n  ${foundWillReceivePropsName}`
                    : '',
                  foundWillUpdateName !== null
                    ? `\n  ${foundWillUpdateName}`
                    : '',
                );
              }
            }
          }
        }

        const partialState = Component.getDerivedStateFromProps.call(
          null,
          element.props,
          inst.state,
        );

        if (__DEV__) {
          if (partialState === undefined) {
            const componentName =
              getComponentNameFromType(Component) || 'Unknown';
            if (!didWarnAboutUndefinedDerivedState[componentName]) {
              console.error(
                '%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' +
                  'You have returned undefined.',
                componentName,
              );
              didWarnAboutUndefinedDerivedState[componentName] = true;
            }
          }
        }

        if (partialState != null) {
          inst.state = assign({}, inst.state, partialState);
        }
      }
    } else {
      if (__DEV__) {
        if (
          Component.prototype &&
          typeof Component.prototype.render === 'function'
        ) {
          const componentName =
            getComponentNameFromType(Component) || 'Unknown';

          if (!didWarnAboutBadClass[componentName]) {
            console.error(
              "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
                'This is likely to cause errors. Change %s to extend React.Component instead.',
              componentName,
              componentName,
            );
            didWarnAboutBadClass[componentName] = true;
          }
        }
      }
      const componentIdentity = {};
      prepareToUseHooks(componentIdentity);
      inst = Component(element.props, publicContext, updater);
      inst = finishHooks(Component, element.props, inst, publicContext);

      if (__DEV__) {
        // Support for module components is deprecated and is removed behind a flag.
        // Whether or not it would crash later, we want to show a good message in DEV first.
        if (inst != null && inst.render != null) {
          const componentName =
            getComponentNameFromType(Component) || 'Unknown';
          if (!didWarnAboutModulePatternComponent[componentName]) {
            console.error(
              'The <%s /> component appears to be a function component that returns a class instance. ' +
                'Change %s to a class that extends React.Component instead. ' +
                "If you can't use a class try assigning the prototype on the function as a workaround. " +
                "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
                'cannot be called with `new` by React.',
              componentName,
              componentName,
              componentName,
            );
            didWarnAboutModulePatternComponent[componentName] = true;
          }
        }
      }

      // If the flag is on, everything is assumed to be a function component.
      // Otherwise, we also do the unfortunate dynamic checks.
      if (
        disableModulePatternComponents ||
        inst == null ||
        inst.render == null
      ) {
        child = inst;
        return;
      }
    }

    inst.props = element.props;
    inst.context = publicContext;
    inst.updater = updater;

    let initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    if (
      typeof inst.UNSAFE_componentWillMount === 'function' ||
      typeof inst.componentWillMount === 'function'
    ) {
      if (typeof inst.componentWillMount === 'function') {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        if (typeof Component.getDerivedStateFromProps !== 'function') {
          if (__DEV__) {
            if (
              warnAboutDeprecatedLifecycles &&
              inst.componentWillMount.__suppressDeprecationWarning !== true
            ) {
              const componentName =
                getComponentNameFromType(Component) || 'Unknown';

              if (!didWarnAboutDeprecatedWillMount[componentName]) {
                console.warn(
                  // keep this warning in sync with ReactStrictModeWarning.js
                  'componentWillMount has been renamed, and is not recommended for use. ' +
                    'See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n' +
                    '* Move code from componentWillMount to componentDidMount (preferred in most cases) ' +
                    'or the constructor.\n' +
                    '\nPlease update the following components: %s',
                  componentName,
                );
                didWarnAboutDeprecatedWillMount[componentName] = true;
              }
            }
          }

          inst.componentWillMount();
        }
      }
      if (
        typeof inst.UNSAFE_componentWillMount === 'function' &&
        typeof Component.getDerivedStateFromProps !== 'function'
      ) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        inst.UNSAFE_componentWillMount();
      }
      if (queue.length) {
        const oldQueue = queue;
        const oldReplace = replace;
        queue = null;
        replace = false;

        if (oldReplace && oldQueue.length === 1) {
          inst.state = oldQueue[0];
        } else {
          let nextState = oldReplace ? oldQueue[0] : inst.state;
          let dontMutate = true;
          for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
            const partial = oldQueue[i];
            const partialState =
              typeof partial === 'function'
                ? partial.call(inst, nextState, element.props, publicContext)
                : partial;
            if (partialState != null) {
              if (dontMutate) {
                dontMutate = false;
                nextState = assign({}, nextState, partialState);
              } else {
                assign(nextState, partialState);
              }
            }
          }
          inst.state = nextState;
        }
      } else {
        queue = null;
      }
    }
    child = inst.render();

    let childContext;
    if (disableLegacyContext) {
      if (__DEV__) {
        const childContextTypes = Component.childContextTypes;
        if (childContextTypes !== undefined) {
          console.error(
            '%s uses the legacy childContextTypes API which is no longer supported. ' +
              'Use React.createContext() instead.',
            getComponentNameFromType(Component) || 'Unknown',
          );
        }
      }
    } else {
      if (typeof inst.getChildContext === 'function') {
        const childContextTypes = Component.childContextTypes;
        if (typeof childContextTypes === 'object') {
          childContext = inst.getChildContext();
          for (const contextKey in childContext) {
            if (!(contextKey in childContextTypes)) {
              throw new Error(
                `${getComponentNameFromType(Component) ||
                  'Unknown'}.getChildContext(): key "${contextKey}" is not defined in childContextTypes.`,
              );
            }
          }
        } else {
          if (__DEV__) {
            console.error(
              '%s.getChildContext(): childContextTypes must be defined in order to ' +
                'use getChildContext().',
              getComponentNameFromType(Component) || 'Unknown',
            );
          }
        }
      }
      if (childContext) {
        context = assign({}, context, childContext);
      }
    }
  }
  return {child, context};
}

type Frame = {
  type: mixed,
  domNamespace: string,
  children: FlatReactChildren,
  fallbackFrame?: Frame,
  childIndex: number,
  context: Object,
  footer: string,
  ...
};

type FrameDev = Frame & {|debugElementStack: Array<ReactElement>|};

class ReactDOMServerRenderer {
  threadID: ThreadID;
  stack: Array<Frame>;
  exhausted: boolean;
  // TODO: type this more strictly:
  currentSelectValue: any;
  previousWasTextNode: boolean;
  makeStaticMarkup: boolean;
  suspenseDepth: number;

  contextIndex: number;
  contextStack: Array<ReactContext<any>>;
  contextValueStack: Array<any>;
  contextProviderStack: ?Array<ReactProvider<any>>; // DEV-only

  constructor(children: mixed, makeStaticMarkup: boolean) {
    const flatChildren = flattenTopLevelChildren(children);

    const topFrame: Frame = {
      type: null,
      // Assume all trees start in the HTML namespace (not totally true, but
      // this is what we did historically)
      domNamespace: HTML_NAMESPACE,
      children: flatChildren,
      childIndex: 0,
      context: emptyObject,
      footer: '',
    };
    if (__DEV__) {
      ((topFrame: any): FrameDev).debugElementStack = [];
    }
    this.threadID = allocThreadID();
    this.stack = [topFrame];
    this.exhausted = false;
    this.currentSelectValue = null;
    this.previousWasTextNode = false;
    this.makeStaticMarkup = makeStaticMarkup;
    this.suspenseDepth = 0;

    // Context (new API)
    this.contextIndex = -1;
    this.contextStack = [];
    this.contextValueStack = [];

    if (__DEV__) {
      this.contextProviderStack = [];
    }
  }

  destroy() {
    if (!this.exhausted) {
      this.exhausted = true;
      this.clearProviders();
      freeThreadID(this.threadID);
    }
  }

  /**
   * Note: We use just two stacks regardless of how many context providers you have.
   * Providers are always popped in the reverse order to how they were pushed
   * so we always know on the way down which provider you'll encounter next on the way up.
   * On the way down, we push the current provider, and its context value *before*
   * we mutated it, onto the stacks. Therefore, on the way up, we always know which
   * provider needs to be "restored" to which value.
   * https://github.com/facebook/react/pull/12985#issuecomment-396301248
   */

  pushProvider<T>(provider: ReactProvider<T>): void {
    const index = ++this.contextIndex;
    const context: ReactContext<any> = provider.type._context;
    const threadID = this.threadID;
    validateContextBounds(context, threadID);
    const previousValue = context[threadID];

    // Remember which value to restore this context to on our way up.
    this.contextStack[index] = context;
    this.contextValueStack[index] = previousValue;
    if (__DEV__) {
      // Only used for push/pop mismatch warnings.
      (this.contextProviderStack: any)[index] = provider;
    }

    // Mutate the current value.
    context[threadID] = provider.props.value;
  }

  popProvider<T>(provider: ReactProvider<T>): void {
    const index = this.contextIndex;
    if (__DEV__) {
      if (index < 0 || provider !== (this.contextProviderStack: any)[index]) {
        console.error('Unexpected pop.');
      }
    }

    const context: ReactContext<any> = this.contextStack[index];
    const previousValue = this.contextValueStack[index];

    // "Hide" these null assignments from Flow by using `any`
    // because conceptually they are deletions--as long as we
    // promise to never access values beyond `this.contextIndex`.
    this.contextStack[index] = (null: any);
    this.contextValueStack[index] = (null: any);
    if (__DEV__) {
      (this.contextProviderStack: any)[index] = (null: any);
    }
    this.contextIndex--;

    // Restore to the previous value we stored as we were walking down.
    // We've already verified that this context has been expanded to accommodate
    // this thread id, so we don't need to do it again.
    context[this.threadID] = previousValue;
  }

  clearProviders(): void {
    // Restore any remaining providers on the stack to previous values
    for (let index = this.contextIndex; index >= 0; index--) {
      const context: ReactContext<any> = this.contextStack[index];
      const previousValue = this.contextValueStack[index];
      context[this.threadID] = previousValue;
    }
  }

  read(bytes: number): string | null {
    if (this.exhausted) {
      return null;
    }

    const prevPartialRenderer = currentPartialRenderer;
    setCurrentPartialRenderer(this);
    const prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = Dispatcher;
    try {
      // Markup generated within <Suspense> ends up buffered until we know
      // nothing in that boundary suspended
      const out = [''];
      let suspended = false;
      while (out[0].length < bytes) {
        if (this.stack.length === 0) {
          this.exhausted = true;
          freeThreadID(this.threadID);
          break;
        }
        const frame: Frame = this.stack[this.stack.length - 1];
        if (suspended || frame.childIndex >= frame.children.length) {
          const footer = frame.footer;
          if (footer !== '') {
            this.previousWasTextNode = false;
          }
          this.stack.pop();
          if (frame.type === 'select') {
            this.currentSelectValue = null;
          } else if (
            frame.type != null &&
            frame.type.type != null &&
            frame.type.type.$$typeof === REACT_PROVIDER_TYPE
          ) {
            const provider: ReactProvider<any> = (frame.type: any);
            this.popProvider(provider);
          } else if (frame.type === REACT_SUSPENSE_TYPE) {
            this.suspenseDepth--;
            const buffered = out.pop();

            if (suspended) {
              suspended = false;
              // If rendering was suspended at this boundary, render the fallbackFrame
              const fallbackFrame = frame.fallbackFrame;

              if (!fallbackFrame) {
                throw new Error(
                  'ReactDOMServer did not find an internal fallback frame for Suspense. ' +
                    'This is a bug in React. Please file an issue.',
                );
              }

              this.stack.push(fallbackFrame);
              out[this.suspenseDepth] += '<!--$!-->';
              // Skip flushing output since we're switching to the fallback
              continue;
            } else {
              out[this.suspenseDepth] += buffered;
            }
          }

          // Flush output
          out[this.suspenseDepth] += footer;
          continue;
        }
        const child = frame.children[frame.childIndex++];

        let outBuffer = '';
        if (__DEV__) {
          pushCurrentDebugStack(this.stack);
          // We're starting work on this frame, so reset its inner stack.
          ((frame: any): FrameDev).debugElementStack.length = 0;
        }
        try {
          outBuffer += this.render(child, frame.context, frame.domNamespace);
        } catch (err) {
          if (err != null && typeof err.then === 'function') {
            if (this.suspenseDepth <= 0) {
              throw new Error(
                // TODO: include component name. This is a bit tricky with current factoring.
                'A React component suspended while rendering, but no fallback UI was specified.\n' +
                  '\n' +
                  'Add a <Suspense fallback=...> component higher in the tree to ' +
                  'provide a loading indicator or placeholder to display.',
              );
            }

            suspended = true;
          } else {
            throw err;
          }
        } finally {
          if (__DEV__) {
            popCurrentDebugStack();
          }
        }
        if (out.length <= this.suspenseDepth) {
          out.push('');
        }
        out[this.suspenseDepth] += outBuffer;
      }
      return out[0];
    } finally {
      ReactCurrentDispatcher.current = prevDispatcher;
      setCurrentPartialRenderer(prevPartialRenderer);
      resetHooksState();
    }
  }

  render(
    child: ReactNode | null,
    context: Object,
    parentNamespace: string,
  ): string {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = '' + child;
      if (text === '') {
        return '';
      }
      if (this.makeStaticMarkup) {
        return escapeTextForBrowser(text);
      }
      if (this.previousWasTextNode) {
        return '<!-- -->' + escapeTextForBrowser(text);
      }
      this.previousWasTextNode = true;
      return escapeTextForBrowser(text);
    } else {
      let nextChild;
      ({child: nextChild, context} = resolve(child, context, this.threadID));
      if (nextChild === null || nextChild === false) {
        return '';
      } else if (!React.isValidElement(nextChild)) {
        if (nextChild != null && nextChild.$$typeof != null) {
          // Catch unexpected special types early.
          const $$typeof = nextChild.$$typeof;

          if ($$typeof === REACT_PORTAL_TYPE) {
            throw new Error(
              'Portals are not currently supported by the server renderer. ' +
                'Render them conditionally so that they only appear on the client render.',
            );
          }

          // Catch-all to prevent an infinite loop if React.Children.toArray() supports some new type.
          throw new Error(
            `Unknown element-like object type: ${($$typeof: any).toString()}. This is likely a bug in React. ` +
              'Please file an issue.',
          );
        }
        const nextChildren = toArray(nextChild);
        const frame: Frame = {
          type: null,
          domNamespace: parentNamespace,
          children: nextChildren,
          childIndex: 0,
          context: context,
          footer: '',
        };
        if (__DEV__) {
          ((frame: any): FrameDev).debugElementStack = [];
        }
        this.stack.push(frame);
        return '';
      }
      // Safe because we just checked it's an element.
      const nextElement = ((nextChild: any): ReactElement);
      const elementType = nextElement.type;

      if (typeof elementType === 'string') {
        return this.renderDOM(nextElement, context, parentNamespace);
      }

      switch (elementType) {
        // TODO: LegacyHidden acts the same as a fragment. This only works
        // because we currently assume that every instance of LegacyHidden is
        // accompanied by a host component wrapper. In the hidden mode, the host
        // component is given a `hidden` attribute, which ensures that the
        // initial HTML is not visible. To support the use of LegacyHidden as a
        // true fragment, without an extra DOM node, we would have to hide the
        // initial HTML in some other way.
        case REACT_LEGACY_HIDDEN_TYPE:
        case REACT_DEBUG_TRACING_MODE_TYPE:
        case REACT_STRICT_MODE_TYPE:
        case REACT_PROFILER_TYPE:
        case REACT_SUSPENSE_LIST_TYPE:
        case REACT_FRAGMENT_TYPE: {
          const nextChildren = toArray(
            ((nextChild: any): ReactElement).props.children,
          );
          const frame: Frame = {
            type: null,
            domNamespace: parentNamespace,
            children: nextChildren,
            childIndex: 0,
            context: context,
            footer: '',
          };
          if (__DEV__) {
            ((frame: any): FrameDev).debugElementStack = [];
          }
          this.stack.push(frame);
          return '';
        }
        case REACT_SUSPENSE_TYPE: {
          const fallback = ((nextChild: any): ReactElement).props.fallback;
          const fallbackChildren = toArray(fallback);
          const nextChildren = toArray(
            ((nextChild: any): ReactElement).props.children,
          );
          const fallbackFrame: Frame = {
            type: null,
            domNamespace: parentNamespace,
            children: fallbackChildren,
            childIndex: 0,
            context: context,
            footer: '<!--/$-->',
          };
          const frame: Frame = {
            fallbackFrame,
            type: REACT_SUSPENSE_TYPE,
            domNamespace: parentNamespace,
            children: nextChildren,
            childIndex: 0,
            context: context,
            footer: '<!--/$-->',
          };
          if (__DEV__) {
            ((frame: any): FrameDev).debugElementStack = [];
            ((fallbackFrame: any): FrameDev).debugElementStack = [];
          }
          this.stack.push(frame);
          this.suspenseDepth++;
          return '<!--$-->';
        }
        // eslint-disable-next-line-no-fallthrough
        case REACT_SCOPE_TYPE: {
          if (enableScopeAPI) {
            const nextChildren = toArray(
              ((nextChild: any): ReactElement).props.children,
            );
            const frame: Frame = {
              type: null,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }
            this.stack.push(frame);
            return '';
          }
          throw new Error(
            'ReactDOMServer does not yet support scope components.',
          );
        }
        // eslint-disable-next-line-no-fallthrough
        default:
          break;
      }
      if (typeof elementType === 'object' && elementType !== null) {
        switch (elementType.$$typeof) {
          case REACT_FORWARD_REF_TYPE: {
            const element: ReactElement = ((nextChild: any): ReactElement);
            let nextChildren;
            const componentIdentity = {};
            prepareToUseHooks(componentIdentity);
            nextChildren = elementType.render(element.props, element.ref);
            nextChildren = finishHooks(
              elementType.render,
              element.props,
              nextChildren,
              element.ref,
            );
            nextChildren = toArray(nextChildren);
            const frame: Frame = {
              type: null,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }
            this.stack.push(frame);
            return '';
          }
          case REACT_MEMO_TYPE: {
            const element: ReactElement = ((nextChild: any): ReactElement);
            const nextChildren = [
              React.createElement(
                elementType.type,
                assign({ref: element.ref}, element.props),
              ),
            ];
            const frame: Frame = {
              type: null,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }
            this.stack.push(frame);
            return '';
          }
          case REACT_PROVIDER_TYPE: {
            const provider: ReactProvider<any> = (nextChild: any);
            const nextProps = provider.props;
            const nextChildren = toArray(nextProps.children);
            const frame: Frame = {
              type: provider,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }

            this.pushProvider(provider);

            this.stack.push(frame);
            return '';
          }
          case REACT_CONTEXT_TYPE: {
            let reactContext = (nextChild: any).type;
            // The logic below for Context differs depending on PROD or DEV mode. In
            // DEV mode, we create a separate object for Context.Consumer that acts
            // like a proxy to Context. This proxy object adds unnecessary code in PROD
            // so we use the old behaviour (Context.Consumer references Context) to
            // reduce size and overhead. The separate object references context via
            // a property called "_context", which also gives us the ability to check
            // in DEV mode if this property exists or not and warn if it does not.
            if (__DEV__) {
              if ((reactContext: any)._context === undefined) {
                // This may be because it's a Context (rather than a Consumer).
                // Or it may be because it's older React where they're the same thing.
                // We only want to warn if we're sure it's a new React.
                if (reactContext !== reactContext.Consumer) {
                  if (!hasWarnedAboutUsingContextAsConsumer) {
                    hasWarnedAboutUsingContextAsConsumer = true;
                    console.error(
                      'Rendering <Context> directly is not supported and will be removed in ' +
                        'a future major release. Did you mean to render <Context.Consumer> instead?',
                    );
                  }
                }
              } else {
                reactContext = (reactContext: any)._context;
              }
            }
            const nextProps: any = (nextChild: any).props;
            const threadID = this.threadID;
            validateContextBounds(reactContext, threadID);
            const nextValue = reactContext[threadID];

            const nextChildren = toArray(nextProps.children(nextValue));
            const frame: Frame = {
              type: nextChild,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }
            this.stack.push(frame);
            return '';
          }
          // eslint-disable-next-line-no-fallthrough
          case REACT_LAZY_TYPE: {
            const element: ReactElement = (nextChild: any);
            const lazyComponent: LazyComponent<any, any> = (nextChild: any)
              .type;
            // Attempt to initialize lazy component regardless of whether the
            // suspense server-side renderer is enabled so synchronously
            // resolved constructors are supported.
            const payload = lazyComponent._payload;
            const init = lazyComponent._init;
            const result = init(payload);
            const nextChildren = [
              React.createElement(
                result,
                assign({ref: element.ref}, element.props),
              ),
            ];
            const frame: Frame = {
              type: null,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '',
            };
            if (__DEV__) {
              ((frame: any): FrameDev).debugElementStack = [];
            }
            this.stack.push(frame);
            return '';
          }
        }
      }

      let info = '';
      if (__DEV__) {
        const owner = nextElement._owner;
        if (
          elementType === undefined ||
          (typeof elementType === 'object' &&
            elementType !== null &&
            Object.keys(elementType).length === 0)
        ) {
          info +=
            ' You likely forgot to export your component from the file ' +
            "it's defined in, or you might have mixed up default and " +
            'named imports.';
        }
        const ownerName = owner ? getComponentNameFromType(owner) : null;
        if (ownerName) {
          info += '\n\nCheck the render method of `' + ownerName + '`.';
        }
      }

      throw new Error(
        'Element type is invalid: expected a string (for built-in ' +
          'components) or a class/function (for composite components) ' +
          `but got: ${
            elementType == null ? elementType : typeof elementType
          }.${info}`,
      );
    }
  }

  renderDOM(
    element: ReactElement,
    context: Object,
    parentNamespace: string,
  ): string {
    const tag = element.type;

    let namespace = parentNamespace;
    if (parentNamespace === HTML_NAMESPACE) {
      namespace = getIntrinsicNamespace(tag);
    }

    let props = element.props;

    if (__DEV__) {
      if (namespace === HTML_NAMESPACE) {
        const isCustomComponent = isCustomComponentFn(tag, props);
        // Should this check be gated by parent namespace? Not sure we want to
        // allow <SVG> or <mATH>.
        if (!isCustomComponent && tag.toLowerCase() !== element.type) {
          console.error(
            '<%s /> is using incorrect casing. ' +
              'Use PascalCase for React components, ' +
              'or lowercase for HTML elements.',
            element.type,
          );
        }
      }
    }

    validateDangerousTag(tag);

    if (tag === 'input') {
      if (__DEV__) {
        checkControlledValueProps('input', props);

        if (
          props.checked !== undefined &&
          props.defaultChecked !== undefined &&
          !didWarnDefaultChecked
        ) {
          console.error(
            '%s contains an input of type %s with both checked and defaultChecked props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the checked prop, or the defaultChecked prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://reactjs.org/link/controlled-components',
            'A component',
            props.type,
          );
          didWarnDefaultChecked = true;
        }
        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultInputValue
        ) {
          console.error(
            '%s contains an input of type %s with both value and defaultValue props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://reactjs.org/link/controlled-components',
            'A component',
            props.type,
          );
          didWarnDefaultInputValue = true;
        }
      }

      props = assign(
        {
          type: undefined,
        },
        props,
        {
          defaultChecked: undefined,
          defaultValue: undefined,
          value: props.value != null ? props.value : props.defaultValue,
          checked: props.checked != null ? props.checked : props.defaultChecked,
        },
      );
    } else if (tag === 'textarea') {
      if (__DEV__) {
        checkControlledValueProps('textarea', props);
        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultTextareaValue
        ) {
          console.error(
            'Textarea elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled textarea ' +
              'and remove one of these props. More info: ' +
              'https://reactjs.org/link/controlled-components',
          );
          didWarnDefaultTextareaValue = true;
        }
      }

      let initialValue = props.value;
      if (initialValue == null) {
        let defaultValue = props.defaultValue;
        // TODO (yungsters): Remove support for children content in <textarea>.
        let textareaChildren = props.children;
        if (textareaChildren != null) {
          if (__DEV__) {
            console.error(
              'Use the `defaultValue` or `value` props instead of setting ' +
                'children on <textarea>.',
            );
          }

          if (defaultValue != null) {
            throw new Error(
              'If you supply `defaultValue` on a <textarea>, do not pass children.',
            );
          }

          if (isArray(textareaChildren)) {
            if (textareaChildren.length > 1) {
              throw new Error('<textarea> can only have at most one child.');
            }

            textareaChildren = textareaChildren[0];
          }

          if (__DEV__) {
            checkPropStringCoercion(textareaChildren, 'children');
          }
          defaultValue = '' + textareaChildren;
        }
        if (defaultValue == null) {
          defaultValue = '';
        }
        initialValue = defaultValue;
      }

      if (__DEV__) {
        checkFormFieldValueStringCoercion(initialValue);
      }
      props = assign({}, props, {
        value: undefined,
        children: '' + initialValue,
      });
    } else if (tag === 'select') {
      if (__DEV__) {
        checkControlledValueProps('select', props);

        for (let i = 0; i < valuePropNames.length; i++) {
          const propName = valuePropNames[i];
          if (props[propName] == null) {
            continue;
          }
          const propNameIsArray = isArray(props[propName]);
          if (props.multiple && !propNameIsArray) {
            console.error(
              'The `%s` prop supplied to <select> must be an array if ' +
                '`multiple` is true.',
              propName,
            );
          } else if (!props.multiple && propNameIsArray) {
            console.error(
              'The `%s` prop supplied to <select> must be a scalar ' +
                'value if `multiple` is false.',
              propName,
            );
          }
        }

        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultSelectValue
        ) {
          console.error(
            'Select elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled select ' +
              'element and remove one of these props. More info: ' +
              'https://reactjs.org/link/controlled-components',
          );
          didWarnDefaultSelectValue = true;
        }
      }
      this.currentSelectValue =
        props.value != null ? props.value : props.defaultValue;
      props = assign({}, props, {
        value: undefined,
      });
    } else if (tag === 'option') {
      let selected = null;
      const selectValue = this.currentSelectValue;
      if (selectValue != null) {
        let value;
        if (props.value != null) {
          if (__DEV__) {
            checkFormFieldValueStringCoercion(props.value);
          }
          value = props.value + '';
        } else {
          if (__DEV__) {
            if (props.dangerouslySetInnerHTML != null) {
              if (!didWarnInvalidOptionInnerHTML) {
                didWarnInvalidOptionInnerHTML = true;
                console.error(
                  'Pass a `value` prop if you set dangerouslyInnerHTML so React knows ' +
                    'which value should be selected.',
                );
              }
            }
          }
          value = flattenOptionChildren(props.children);
        }
        selected = false;
        if (isArray(selectValue)) {
          // multiple
          for (let j = 0; j < selectValue.length; j++) {
            if (__DEV__) {
              checkFormFieldValueStringCoercion(selectValue[j]);
            }
            if ('' + selectValue[j] === value) {
              selected = true;
              break;
            }
          }
        } else {
          if (__DEV__) {
            checkFormFieldValueStringCoercion(selectValue);
          }
          selected = '' + selectValue === value;
        }

        props = assign(
          {
            selected: undefined,
          },
          props,
          {
            selected: selected,
          },
        );
      }
    }

    if (__DEV__) {
      validatePropertiesInDevelopment(tag, props);
    }

    assertValidProps(tag, props);

    let out = createOpenTagMarkup(
      element.type,
      tag,
      props,
      namespace,
      this.makeStaticMarkup,
      this.stack.length === 1,
    );
    let footer = '';
    if (omittedCloseTags.hasOwnProperty(tag)) {
      out += '/>';
    } else {
      out += '>';
      footer = '</' + element.type + '>';
    }
    let children;
    const innerMarkup = getNonChildrenInnerMarkup(props);
    if (innerMarkup != null) {
      children = [];
      if (
        newlineEatingTags.hasOwnProperty(tag) &&
        innerMarkup.charAt(0) === '\n'
      ) {
        // text/html ignores the first character in these tags if it's a newline
        // Prefer to break application/xml over text/html (for now) by adding
        // a newline specifically to get eaten by the parser. (Alternately for
        // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
        // \r is normalized out by HTMLTextAreaElement#value.)
        // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
        // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
        // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
        // See: Parsing of "textarea" "listing" and "pre" elements
        //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
        out += '\n';
      }
      out += innerMarkup;
    } else {
      children = toArray(props.children);
    }
    const frame = {
      domNamespace: getChildNamespace(parentNamespace, element.type),
      type: tag,
      children,
      childIndex: 0,
      context: context,
      footer: footer,
    };
    if (__DEV__) {
      ((frame: any): FrameDev).debugElementStack = [];
    }
    this.stack.push(frame);
    this.previousWasTextNode = false;
    return out;
  }
}

export default ReactDOMServerRenderer;
