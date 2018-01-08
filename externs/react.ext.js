/** @suppress {duplicate} */
var React = {};

React.version;

React.Children = {};
React.Children.map;
React.Children.forEach;
React.Children.count;
React.Children.toArray;
React.Children.only;

React.Component;
React.PureComponent;
React.unstable_AsyncComponent;
React.Fragment;
React.createElement;
React.cloneElement;
React.createFactory;
React.isValidElement;
React.version;

React.Component.prototype.isReactComponent;
React.Component.prototype.updater;
React.Component.prototype.props;
React.Component.prototype.state;
React.Component.prototype.refs;
React.Component.prototype.context;
React.Component.prototype.propTypes;
React.Component.prototype.contextTypes;
React.Component.prototype.mixins;
React.Component.prototype.childContextTypes;
React.Component.prototype.defaultProps;
React.Component.prototype.getInitialState;
React.Component.prototype.getDefaultProps;
React.Component.prototype.getChildContext;
React.Component.prototype.transferPropsTo;
React.Component.prototype.forceUpdate;
React.Component.prototype.isMounted;
React.Component.prototype.setState;
React.Component.prototype.replaceState;
React.Component.prototype.componentWillMount;
React.Component.prototype.componentDidMount;
React.Component.prototype.componentWillReceiveProps;
React.Component.prototype.shouldComponentUpdate;
React.Component.prototype.componentWillUpdate;
React.Component.prototype.componentDidUpdate;
React.Component.prototype.componentWillUnmount;
React.Component.prototype.componentDidCatch;
React.Component.prototype.render;

React.PureComponent.prototype.isPureReactComponent;

React.SyntheticEvent;
React.SyntheticEvent.extend;
React.SyntheticEvent.eventPool;
React.SyntheticEvent.getPooled;
React.SyntheticEvent.release;
React.SyntheticEvent.prototype.destructor;
React.SyntheticEvent.prototype.persist;
React.SyntheticEvent.prototype.isPersistent;
React.SyntheticEvent.prototype.nativeEvent;
React.SyntheticEvent.prototype.preventDefault;
React.SyntheticEvent.prototype.stopPropagation;
/** @type {DispatchConfig} */
React.SyntheticEvent.prototype.dispatchConfig;
React.SyntheticEvent.prototype.nativeEvent;
React.SyntheticEvent.prototype._targetInst;
React.SyntheticEvent.prototype.isDefaultPrevented;
React.SyntheticEvent.prototype.isPropagationStopped;
React.SyntheticEvent.prototype._dispatchListeners;
React.SyntheticEvent.prototype._dispatchInstances;

/** @suppress {duplicate} */
var DispatchConfig;
DispatchConfig.dependencies;
DispatchConfig.phasedRegistrationNames = {};
DispatchConfig.phasedRegistrationNames.bubbled;
DispatchConfig.phasedRegistrationNames.captured;
DispatchConfig.registrationName;

/** @suppress {duplicate} */
var FiberNode = {};
FiberNode.prototype.tag;
FiberNode.prototype.key;
FiberNode.prototype.type;
FiberNode.prototype.stateNode;
FiberNode.prototype.return;
FiberNode.prototype.child;
FiberNode.prototype.sibling;
FiberNode.prototype.index;
FiberNode.prototype.ref;
FiberNode.prototype.pendingProps;
FiberNode.prototype.memoizedProps;
FiberNode.prototype.updateQueue;
FiberNode.prototype.memoizedState;
FiberNode.prototype.internalContextTag;
FiberNode.prototype.effectTag;
FiberNode.prototype.nextEffect;
FiberNode.prototype.firstEffect;
FiberNode.prototype.lastEffect;
FiberNode.prototype.expirationTime;
FiberNode.prototype.alternate;
FiberNode.prototype._debugID;
FiberNode.prototype._debugSource;
FiberNode.prototype._debugOwner;
FiberNode.prototype._debugIsCurrentlyTiming;

var Deadline = {};
Deadline.prototype.timeRemaining;

var Reconciler = {};
Reconciler.createContainer;
Reconciler.updateContainer;
Reconciler.updateContainerAtExpirationTime;
Reconciler.flushRoot;
Reconciler.requestWork;
Reconciler.batchedUpdates;
Reconciler.unbatchedUpdates;
Reconciler.flushSync;
Reconciler.deferredUpdates;
Reconciler.injectIntoDevTools;
Reconciler.computeUniqueAsyncExpiration;
Reconciler.getPublicRootInstance;
Reconciler.findHostInstance;
Reconciler.findHostInstanceWithNoPortals;

var updater = {};
updater.isMounted;
updater.enqueueSetState;
updater.enqueueReplaceState;
updater.enqueueForceUpdate;

/* Non-public API needed to compile react and react-dom independently */

var $$typeof;
var type;
var key;
var ref;
var props;
var _owner;

React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {};
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.assign;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.EventPluginHub;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.EventPluginRegistry;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.EventPropagators;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  .ReactControlledComponent;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDOMComponentTree;
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactDOMEventListener;

var __REACT_DEVTOOLS_GLOBAL_HOOK__;

var module, require, exports, define;
module.exports;
