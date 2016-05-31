const ErrorMap = {
  "0": "Mismatched list of contexts in callback queue",
  "1": "injectDOMPropertyConfig(...): You're trying to inject DOM property '%s' which has already been injected. You may be accidentally injecting the same DOM property config twice, or you may be injecting two configs that have conflicting property names.",
  "2": "DOMProperty: Properties that have side effects must use property: %s",
  "3": "DOMProperty: Value can be one of boolean, overloaded boolean, or numeric value, but not a combination: %s",
  "4": "dangerouslyRenderMarkup(...): Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use ReactDOMServer.renderToString for server rendering.",
  "5": "dangerouslyRenderMarkup(...): Missing markup.",
  "6": "Danger: Assigning to an already-occupied result index.",
  "7": "Danger: Did not assign to every index of resultList.",
  "8": "Danger: Expected markup to render %s nodes, but rendered %s.",
  "9": "dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a worker thread. Make sure `window` and `document` are available globally before requiring React when unit testing or use ReactDOMServer.renderToString() for server rendering.",
  "10": "dangerouslyReplaceNodeWithMarkup(...): Missing markup.",
  "11": "dangerouslyReplaceNodeWithMarkup(...): Cannot replace markup of the <html> node. This is because browser quirks make this unreliable and/or slow. If you want to render to the root you must use server rendering. See ReactDOMServer.renderToString().",
  "12": "Expected %s listener to be a function, instead got type %s",
  "13": "processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.",
  "14": "EventPluginRegistry: Cannot inject event plugins that do not exist in the plugin ordering, `%s`.",
  "15": "EventPluginRegistry: Event plugins must implement an `extractEvents` method, but `%s` does not.",
  "16": "EventPluginRegistry: Failed to publish event `%s` for plugin `%s`.",
  "17": "EventPluginHub: More than one plugin attempted to publish the same event name, `%s`.",
  "18": "EventPluginHub: More than one plugin attempted to publish the same registration name, `%s`.",
  "19": "EventPluginRegistry: Cannot inject event plugin ordering more than once. You are likely trying to load more than one copy of React.",
  "20": "EventPluginRegistry: Cannot inject two different event plugins using the same name, `%s`.",
  "21": "executeDirectDispatch(...): Invalid `event`.",
  "22": "Cannot provide a checkedLink and a valueLink. If you want to use checkedLink, you probably don't want to use valueLink and vice versa.",
  "23": "Cannot provide a valueLink and a value or onChange event. If you want to use value or onChange, you probably don't want to use valueLink.",
  "24": "Cannot provide a checkedLink and a checked property or onChange event. If you want to use checked or onChange, you probably don't want to use checkedLink",
  "25": "Do not override existing functions.",
  "26": "Trying to release an instance into a pool of a different type.",
  "27": "ReactART: Can not insert node before itself",
  "28": "ReactClassInterface: You are attempting to override `%s` from your class specification. Ensure that your method names do not overlap with React methods.",
  "29": "ReactClassInterface: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.",
  "30": "ReactClass: You're attempting to use a component class or function as a mixin. Instead, just use a regular object.",
  "31": "ReactClass: You're attempting to use a component as a mixin. Instead, just use a regular object.",
  "32": "ReactClass: Unexpected spec policy %s for key %s when mixing in component specs.",
  "33": "ReactClass: You are attempting to define a reserved property, `%s`, that shouldn't be on the \"statics\" key. Define it as an instance property instead; it will still be accessible on the constructor.",
  "34": "ReactClass: You are attempting to define `%s` on your component more than once. This conflict may be due to a mixin.",
  "35": "mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.",
  "36": "mergeIntoWithNoDuplicateKeys(): Tried to merge two objects with the same key: `%s`. This conflict may be due to a mixin; in particular, this may be caused by two getInitialState() or getDefaultProps() methods returning objects with clashing keys.",
  "37": "%s.getInitialState(): must return an object or null",
  "38": "createClass(...): Class specification must implement a `render` method.",
  "39": "setState(...): takes an object of state variables to update or a function which returns an object of state variables.",
  "40": "ReactCompositeComponent: injectEnvironment() can only be called once.",
  "41": "Expected devtool events to fire for the child before its parent includes it in onSetChildren().",
  "42": "Expected onSetDisplayName() to fire for the child before its parent includes it in onSetChildren().",
  "43": "Expected onSetChildren() or onSetText() to fire for the child before its parent includes it in onSetChildren().",
  "44": "Expected onMountComponent() to fire for the child before its parent includes it in onSetChildren().",
  "45": "Expected onSetParent() and onSetChildren() to be consistent (%s has parents %s and %s).",
  "46": "%s(...): A valid React element (or null) must be returned. You may have returned undefined, an array or some other invalid object.",
  "47": "%s.state: must be set to an object or null",
  "48": "%s.getChildContext(): childContextTypes must be defined in order to use getChildContext().",
  "49": "%s.getChildContext(): key \"%s\" is not defined in childContextTypes.",
  "50": "%s.render(): A valid React element (or null) must be returned. You may have returned undefined, an array or some other invalid object.",
  "51": "Stateless function components cannot have refs.",
  "52": "%s is a void element tag and must not have `children` or use `props.dangerouslySetInnerHTML`.%s",
  "53": "Can only set one of `children` or `props.dangerouslySetInnerHTML`.",
  "54": "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://fb.me/react-invariant-dangerously-set-inner-html for more information.",
  "55": "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.%s",
  "56": "Must be mounted to trap events",
  "57": "trapBubbledEvent(...): Requires node to be rendered.",
  "58": "Invalid tag: %s",
  "59": "<%s> tried to unmount. Because of cross-browser quirks it is impossible to unmount some top-level components (eg <html>, <head>, and <body>) reliably and efficiently. To fix this, have a single top-level component that never unmounts render these elements.",
  "60": "Unable to find element with ID %s.",
  "61": "getNodeFromInstance: Invalid argument.",
  "62": "React DOM tree root should always have a node reference.",
  "63": "ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported.",
  "64": "Missing closing comment for text component %s",
  "65": "`dangerouslySetInnerHTML` does not make sense on <textarea>.",
  "66": "If you supply `defaultValue` on a <textarea>, do not pass children.",
  "67": "<textarea> can only have at most one child.",
  "68": "isAncestor: Invalid argument.",
  "69": "getParentInstance: Invalid argument.",
  "70": "React.addons.createFragment(...): Encountered an invalid child; DOM elements are not valid children of React components.",
  "71": "There is no registered component for the tag %s",
  "72": "getNextDescendantID(%s, %s): Received an invalid React DOM ID.",
  "73": "getNextDescendantID(...): React has made an invalid assumption about the DOM hierarchy. Expected `%s` to be an ancestor of `%s`.",
  "74": "getFirstCommonAncestorID(%s, %s): Expected a valid React DOM ID: %s",
  "75": "traverseParentPath(...): Cannot traverse from and to the same ID, `%s`.",
  "76": "traverseParentPath(%s, %s, ...): Cannot traverse from two IDs that do not have a parent path.",
  "77": "traverseParentPath(%s, %s, ...): Detected an infinite loop while traversing the React DOM ID tree. This may be due to malformed IDs: %s",
  "78": "_registerComponent(...): Target container is not a DOM element.",
  "79": "parentComponent must be a valid React Component",
  "80": "ReactDOM.render(): Invalid component element.%s",
  "81": "unmountComponentAtNode(...): Target container is not a DOM element.",
  "82": "mountComponentIntoNode(...): Target container is not valid.",
  "83": "You're trying to render a component to the document using server rendering but the checksum was invalid. This usually means you rendered a different component type or props on the client from the one on the server, or your render() methods are impure. React cannot handle this case due to cross-browser quirks by rendering at the document root. You should look for environment dependent code in your components and ensure the props are the same client and server side:\n%s",
  "84": "You're trying to render a component to the document but you didn't use server rendering. We can't do this without using server rendering due to cross-browser quirks. See ReactDOMServer.renderToString() for server rendering.",
  "85": "updateTextContent called on non-empty component.",
  "86": "All native instances should have a tag.",
  "87": "Expected a component class, got %s.%s",
  "88": "Expect a native root tag, instead got %s",
  "89": "RawText \"%s\" must be wrapped in an explicit <Text> component.",
  "90": "Unexpected node: %s",
  "91": "addComponentAsRefTo(...): Only a ReactOwner can have refs. You might be adding a ref to a component that was not created inside a component's `render` method, or you have multiple copies of React loaded (details: https://fb.me/react-refs-must-have-owner).",
  "92": "removeComponentAsRefFrom(...): Only a ReactOwner can have refs. You might be removing a ref to a component that was not created inside a component's `render` method, or you have multiple copies of React loaded (details: https://fb.me/react-refs-must-have-owner).",
  "93": "performUpdateIfNecessary: Unexpected batch number (current %s, pending %s)",
  "94": "renderToString(): You must pass a valid ReactElement.",
  "95": "renderToStaticMarkup(): You must pass a valid ReactElement.",
  "96": "findAllInRenderedTree(...): instance must be a composite component",
  "97": "TestUtils.scryRenderedDOMComponentsWithClass expects a className as a second argument.",
  "98": "ReactShallowRenderer render(): Invalid component element.%s",
  "99": "ReactShallowRenderer render(): Shallow rendering works only with custom components, not primitives (%s). Instead of calling `.render(el)` and inspecting the rendered output, look at `el.props` directly instead.",
  "100": "TestUtils.Simulate expects a component instance and not a ReactElement.TestUtils.Simulate will not work if you are using shallow rendering.",
  "101": "%s(...): Expected the last optional `callback` argument to be a function. Instead received: %s.",
  "102": "ReactUpdates: must inject a reconcile transaction class and batching strategy",
  "103": "Expected flush transaction's stored dirty-components length (%s) to match dirty-components array length (%s).",
  "104": "ReactUpdates.asap: Can't enqueue an asap callback in a context whereupdates are not being batched.",
  "105": "ReactUpdates: must provide a reconcile transaction class",
  "106": "ReactUpdates: must provide a batching strategy",
  "107": "ReactUpdates: must provide a batchedUpdates() function",
  "108": "ReactUpdates: must provide an isBatchingUpdates boolean attribute",
  "109": "Ended a touch event which was not counted in trackedTouchCount.",
  "110": "Touch object is missing identifier",
  "111": "Touch data should have been recorded on start",
  "112": "Cannot find single active touch",
  "113": "SimpleEventPlugin: Unhandled event type, `%s`.",
  "114": "Transaction.perform(...): Cannot initialize a transaction when there is already an outstanding transaction.",
  "115": "Transaction.closeAll(): Cannot close transaction when none are open.",
  "116": "accumulate(...): Accumulated items must be not be null or undefined.",
  "117": "accumulateInto(...): Accumulated items must not be null or undefined.",
  "118": "%s: %s type `%s` is invalid; it must be a function, usually from React.PropTypes.",
  "119": "findDOMNode was called on an unmounted component.",
  "120": "Element appears to be neither ReactComponent nor DOMNode (keys: %s)",
  "121": "findNodeHandle(...): Argument is not a component (type: %s, keys: %s)",
  "122": "findNodeHandle(...): Unable to find node handle for unmounted component.",
  "123": "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",
  "124": "Encountered invalid React node of type %s",
  "125": "onlyChild must be passed a children with exactly one child.",
  "126": "reactComponentExpect(...): instance must be a composite component",
  "127": "Objects are not valid as a React child (found: %s).%s",
  "128": "update(): expected target of %s to be an array; got %s.",
  "129": "update(): expected spec of %s to be an array; got %s. Did you forget to wrap your parameter in an array?",
  "130": "update(): You provided a key path to update() that did not contain one of %s. Did you forget to include {%s: ...}?",
  "131": "Cannot have more than one key in an object with %s",
  "132": "update(): %s expects a spec of type 'object'; got %s",
  "133": "update(): %s expects a target of type 'object'; got %s",
  "134": "Expected %s target to be an array; got %s",
  "135": "update(): expected spec of %s to be an array of arrays; got %s. Did you forget to wrap your parameters in an array?",
  "136": "update(): expected spec of %s to be a function; got %s."
};

function replaceArgs(msg, argList) {
  let argIdx = 0;
  return msg.replace(/%s/g, function() {
    const arg = argList[argIdx++];
    return arg === undefined ? '[missing argument]' : arg;
  });
}

function segmentify(str) {
  const urlRegex = /(https:\/\/fb\.me\/[a-z\-]+)/g;
  const matchResult = str.match(urlRegex);
  if (!matchResult) {
    return str;
  }

  const segments = str.split(urlRegex);

  for (let i = 0; i < segments.length; i++) {
    const matchIdx = matchResult.indexOf(segments[i]);
    if (matchIdx !== -1) {
      const url = matchResult[matchIdx];
      segments[i] = (<a key={i} target="_blank" href={url}>{url}</a>);
    }
  }

  return segments;
}

// ?invariant=123&args="foo"&args="bar"
function parseQueryString() {
  const rawQueryString = window.location.search.substring(1);
  if (!rawQueryString) {
    return null;
  }

  let code = '';
  let args = [];

  const queries = decodeURIComponent(rawQueryString).split('&');
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (query.indexOf('invariant=') === 0) {
      code = query.slice(10);
    } else if (query.indexOf('args=') === 0) {
      args.push(query.slice(5));
    }
  }

  args = args.map((str) => str.replace(/^\ *\"(.*)\"\ *$/, '$1'));

  return [code, args];
}

function ErrorReassembleResult(props) {
  const code = props.code;
  const errorMsg = props.msg;

  if (!code) {
    return (
      <p>
        No valid query params provided in the URL. Here's an example: {' '}
        <a href="/react/docs/error-code.html?invariant=50&args=%22Foobar%22">
          http://facebook.github.io/react/docs/error-code.html?invariant=50&args="Foobar"
        </a>
      </p>
    );
  }

  return (
    <div>
      <h3>Error #{code}</h3>
      <code>{segmentify(errorMsg)}</code>
    </div>
  );
}

class ErrorCode extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      code: null,
      errorMsg: '',
    };
  }

  componentWillMount() {
    const parseResult = parseQueryString();
    if (parseResult != null) {
      const [code, args] = parseResult;
      if (ErrorMap[code]) {
        this.setState({
          code: code,
          errorMsg: replaceArgs(ErrorMap[code], args),
        });
      }
    }
  }

  render() {
    return (
      <div>
        <ErrorReassembleResult code={this.state.code} msg={this.state.errorMsg} />
      </div>
    );
  }
}

ReactDOM.render(
  <ErrorCode />,
  document.querySelector('.error-code-container')
);
