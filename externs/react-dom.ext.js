/** @suppress {duplicate} */
var ReactDOM = {};
ReactDOM.version;
ReactDOM.findDOMNode;
ReactDOM.hydrate;
ReactDOM.render;
ReactDOM.unstable_renderSubtreeIntoContainer;
ReactDOM.unmountComponentAtNode;
ReactDOM.createPortal;
ReactDOM.unstable_createPortal;
ReactDOM.unstable_batchedUpdates;
ReactDOM.unstable_deferredUpdates;
ReactDOM.flushSync;
ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

/** @suppress {duplicate} */
var ReactDOMServer = {};
ReactDOMServer.renderToString;
ReactDOMServer.renderToStaticMarkup;
ReactDOMServer.renderToNodeStream;
ReactDOMServer.renderToStaticNodeStream;

/* Used by ReactInstanceMap */
var _reactInternalFiber;

/**
 * React event system creates plugins and event properties dynamically.
 * These externs are needed when consuming React as a JavaScript module
 * in light of new ClojureScript compiler additions (as of version 1.9.456).
 * See the following link for an example.
 * https://github.com/facebook/react/blob/c7129c/src/renderers/dom/shared/eventPlugins/SimpleEventPlugin.js#L43
 */
/** @suppress {duplicate} */
var ResponderEventPlugin;
/** @suppress {duplicate} */
var SimpleEventPlugin;
/** @suppress {duplicate} */
var TapEventPlugin;
/** @suppress {duplicate} */
var EnterLeaveEventPlugin;
/** @suppress {duplicate} */
var ChangeEventPlugin;
/** @suppress {duplicate} */
var SelectEventPlugin;
/** @suppress {duplicate} */
var BeforeInputEventPlugin;

var bubbled;
var captured;
/* Keep in sync with BrowserEventConstants */
var topAbort;
var topAnimationEnd;
var topAnimationIteration;
var topAnimationStart;
var topBlur;
var topCancel;
var topCanPlay;
var topCanPlayThrough;
var topChange;
var topClick;
var topClose;
var topCompositionEnd;
var topCompositionStart;
var topCompositionUpdate;
var topContextMenu;
var topCopy;
var topCut;
var topDoubleClick;
var topDrag;
var topDragEnd;
var topDragEnter;
var topDragExit;
var topDragLeave;
var topDragOver;
var topDragStart;
var topDrop;
var topDurationChange;
var topEmptied;
var topEncrypted;
var topEnded;
var topError;
var topFocus;
var topInput;
var topKeyDown;
var topKeyPress;
var topKeyUp;
var topLoadedData;
var topLoad;
var topLoadedMetadata;
var topLoadStart;
var topMouseDown;
var topMouseMove;
var topMouseOut;
var topMouseOver;
var topMouseUp;
var topPaste;
var topPause;
var topPlay;
var topPlaying;
var topProgress;
var topRateChange;
var topScroll;
var topSeeked;
var topSeeking;
var topSelectionChange;
var topStalled;
var topSuspend;
var topTextInput;
var topTimeUpdate;
var topToggle;
var topTouchCancel;
var topTouchEnd;
var topTouchMove;
var topTouchStart;
var topTransitionEnd;
var topVolumeChange;
var topWaiting;
var topWheel;

/* Globals not provided by the BROWSER environment */
var requestIdleCallback;
var cancelIdleCallback;
var MSApp;
