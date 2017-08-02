/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPartialRenderer
 */

'use strict';

var DOMMarkupOperations = require('DOMMarkupOperations');
var React = require('react');
var ReactControlledValuePropTypes = require('ReactControlledValuePropTypes');

var assertValidProps = require('assertValidProps');
var dangerousStyleValue = require('dangerousStyleValue');
var emptyObject = require('fbjs/lib/emptyObject');
var escapeTextContentForBrowser = require('escapeTextContentForBrowser');
var hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');
var invariant = require('fbjs/lib/invariant');
var memoizeStringOnly = require('fbjs/lib/memoizeStringOnly');
var omittedCloseTags = require('omittedCloseTags');

var toArray = React.Children.toArray;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var checkPropTypes = require('prop-types/checkPropTypes');
  var warnValidStyle = require('warnValidStyle');
  var {
    validateProperties: validateARIAProperties,
  } = require('ReactDOMInvalidARIAHook');
  var {
    validateProperties: validateInputPropertes,
  } = require('ReactDOMNullInputValuePropHook');
  var {
    validateProperties: validateUnknownPropertes,
  } = require('ReactDOMUnknownPropertyHook');
  var validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputPropertes(type, props);
    validateUnknownPropertes(type, props);
  };

  var describeComponentFrame = require('describeComponentFrame');
  var describeStackFrame = function(element): string {
    var source = element._source;
    var type = element.type;
    var name = getComponentName(type);
    var ownerName = null;
    return describeComponentFrame(name, source, ownerName);
  };

  var {ReactDebugCurrentFrame} = require('ReactGlobalSharedState');
  var currentDebugStack = null;
  var currentDebugElementStack = null;
  var setCurrentDebugStack = function(stack) {
    currentDebugElementStack = stack[stack.length - 1].debugElementStack;
    // We are about to enter a new composite stack, reset the array.
    currentDebugElementStack.length = 0;
    currentDebugStack = stack;
    ReactDebugCurrentFrame.getCurrentStack = getStackAddendum;
  };
  var pushElementToDebugStack = function(element) {
    if (currentDebugElementStack !== null) {
      currentDebugElementStack.push(element);
    }
  };
  var resetCurrentDebugStack = function() {
    currentDebugElementStack = null;
    currentDebugStack = null;
    ReactDebugCurrentFrame.getCurrentStack = null;
  };
  var getStackAddendum = function(): null | string {
    if (currentDebugStack === null) {
      return null;
    }
    let stack = '';
    let debugStack = currentDebugStack;
    for (let i = debugStack.length - 1; i >= 0; i--) {
      let debugElementStack = debugStack[i].debugElementStack;
      for (let ii = debugElementStack.length - 1; ii >= 0; ii--) {
        stack += describeStackFrame(debugElementStack[ii]);
      }
    }
    return stack;
  };
}

var didWarnDefaultInputValue = false;
var didWarnDefaultChecked = false;
var didWarnDefaultSelectValue = false;
var didWarnDefaultTextareaValue = false;
var didWarnInvalidOptionChildren = false;
var valuePropNames = ['value', 'defaultValue'];
var newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true,
};

function getComponentName(type) {
  return typeof type === 'string'
    ? type
    : typeof type === 'function' ? type.displayName || type.name : null;
}

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name
var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};
function validateDangerousTag(tag) {
  if (!validatedTagCache.hasOwnProperty(tag)) {
    invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag);
    validatedTagCache[tag] = true;
  }
}

var processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

function createMarkupForStyles(styles, component) {
  var serialized = '';
  var delimiter = '';
  for (var styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    var isCustomProperty = styleName.indexOf('--') === 0;
    var styleValue = styles[styleName];
    if (__DEV__) {
      if (!isCustomProperty) {
        warnValidStyle(styleName, styleValue, component);
      }
    }
    if (styleValue != null) {
      serialized += delimiter + processStyleName(styleName) + ':';
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
  publicInstance: ReactComponent<any, any, any>,
  callerName: string,
) {
  if (__DEV__) {
    var constructor = publicInstance.constructor;
    warning(
      false,
      '%s(...): Can only update a mounting component. ' +
        'This usually means you called %s() outside componentWillMount() on the server. ' +
        'This is a no-op.\n\nPlease check the code for the %s component.',
      callerName,
      callerName,
      (constructor && getComponentName(constructor)) || 'ReactClass',
    );
  }
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function getNonChildrenInnerMarkup(props) {
  var innerHTML = props.dangerouslySetInnerHTML;
  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    var content = props.children;
    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextContentForBrowser(content);
    }
  }
  return null;
}

function flattenOptionChildren(children) {
  var content = '';
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      content += child;
    } else {
      if (__DEV__) {
        if (!didWarnInvalidOptionChildren) {
          didWarnInvalidOptionChildren = true;
          warning(
            false,
            'Only strings and numbers are supported as <option> children.',
          );
        }
      }
    }
  });
  return content;
}

function maskContext(type, context) {
  var contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }
  var maskedContext = {};
  for (var contextName in contextTypes) {
    maskedContext[contextName] = context[contextName];
  }
  return maskedContext;
}

function checkContextTypes(typeSpecs, values, location: string) {
  if (__DEV__) {
    checkPropTypes(typeSpecs, values, location, 'Component', getStackAddendum);
  }
}

function processContext(type, context) {
  var maskedContext = maskContext(type, context);
  if (__DEV__) {
    if (type.contextTypes) {
      checkContextTypes(type.contextTypes, maskedContext, 'context');
    }
  }
  return maskedContext;
}

var STYLE = 'style';
var RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null,
};

function isCustomComponent(tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null;
}

function createOpenTagMarkup(
  tagVerbatim,
  tagLowercase,
  props,
  makeStaticMarkup,
  isRootElement,
  instForDebug,
) {
  var ret = '<' + tagVerbatim;

  for (var propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    var propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    if (propKey === STYLE) {
      propValue = createMarkupForStyles(propValue, instForDebug);
    }
    var markup = null;
    if (isCustomComponent(tagLowercase, props)) {
      if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
        markup = DOMMarkupOperations.createMarkupForCustomAttribute(
          propKey,
          propValue,
        );
      }
    } else {
      markup = DOMMarkupOperations.createMarkupForProperty(propKey, propValue);
    }
    if (markup) {
      ret += ' ' + markup;
    }
  }

  // For static pages, no need to put React ID and checksum. Saves lots of
  // bytes.
  if (makeStaticMarkup) {
    return ret;
  }

  if (isRootElement) {
    ret += ' ' + DOMMarkupOperations.createMarkupForRoot();
  }
  return ret;
}

function validateRenderResult(child, type) {
  if (child === undefined) {
    invariant(
      false,
      '%s(...): Nothing was returned from render. This usually means a ' +
        'return statement is missing. Or, to render nothing, ' +
        'return null.',
      getComponentName(type) || 'Component',
    );
  }
}

function resolve(child, context) {
  while (React.isValidElement(child)) {
    if (__DEV__) {
      pushElementToDebugStack(child);
    }
    var Component = child.type;
    if (typeof Component !== 'function') {
      break;
    }
    var publicContext = processContext(Component, context);
    var inst;
    var queue = [];
    var replace = false;
    var updater = {
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
      enqueueSetState: function(publicInstance, partialState) {
        if (queue === null) {
          warnNoop(publicInstance, 'setState');
          return null;
        }
        queue.push(partialState);
      },
    };

    if (shouldConstruct(Component)) {
      inst = new Component(child.props, publicContext, updater);
    } else {
      inst = Component(child.props, publicContext, updater);
      if (inst == null || inst.render == null) {
        child = inst;
        validateRenderResult(child, Component);
        continue;
      }
    }

    inst.props = child.props;
    inst.context = publicContext;
    inst.updater = updater;

    var initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    if (inst.componentWillMount) {
      inst.componentWillMount();
      if (queue.length) {
        var oldQueue = queue;
        var oldReplace = replace;
        queue = null;
        replace = false;

        if (oldReplace && oldQueue.length === 1) {
          inst.state = oldQueue[0];
        } else {
          var nextState = oldReplace ? oldQueue[0] : inst.state;
          var dontMutate = true;
          for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
            var partial = oldQueue[i];
            var partialState = typeof partial === 'function'
              ? partial.call(inst, nextState, child.props, publicContext)
              : partial;
            if (partialState) {
              if (dontMutate) {
                dontMutate = false;
                nextState = Object.assign({}, nextState, partialState);
              } else {
                Object.assign(nextState, partialState);
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

    if (__DEV__) {
      if (child === undefined && inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        child = null;
      }
    }
    validateRenderResult(child, Component);

    var childContext;
    if (typeof inst.getChildContext === 'function') {
      var childContextTypes = Component.childContextTypes;
      invariant(
        typeof childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
          'use getChildContext().',
        getComponentName(Component) || 'Unknown',
      );
      childContext = inst.getChildContext();
      for (let contextKey in childContext) {
        invariant(
          contextKey in childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          getComponentName(Component) || 'Unknown',
          contextKey,
        );
      }
    }
    if (childContext) {
      context = Object.assign({}, context, childContext);
    }
  }
  return {child, context};
}

class ReactDOMServerRenderer {
  constructor(element, makeStaticMarkup) {
    var children = React.isValidElement(element) ? [element] : toArray(element);
    var topFrame = {
      children,
      childIndex: 0,
      context: emptyObject,
      footer: '',
    };
    if (__DEV__) {
      topFrame.debugElementStack = [];
    }
    this.stack = [topFrame];
    this.exhausted = false;
    this.currentSelectValue = null;
    this.previousWasTextNode = false;
    this.makeStaticMarkup = makeStaticMarkup;
  }

  read(bytes) {
    if (this.exhausted) {
      return null;
    }

    var out = '';
    while (out.length < bytes) {
      if (this.stack.length === 0) {
        this.exhausted = true;
        break;
      }
      var frame = this.stack[this.stack.length - 1];
      if (frame.childIndex >= frame.children.length) {
        out += frame.footer;
        this.previousWasTextNode = false;
        this.stack.pop();
        if (frame.tag === 'select') {
          this.currentSelectValue = null;
        }
        continue;
      }
      var child = frame.children[frame.childIndex++];
      if (__DEV__) {
        setCurrentDebugStack(this.stack);
      }
      out += this.render(child, frame.context);
      if (__DEV__) {
        // TODO: Handle reentrant server render calls. This doesn't.
        resetCurrentDebugStack();
      }
    }
    return out;
  }

  render(child, context) {
    if (typeof child === 'string' || typeof child === 'number') {
      var text = '' + child;
      if (text === '') {
        return '';
      }
      if (this.makeStaticMarkup) {
        return escapeTextContentForBrowser(text);
      }
      if (this.previousWasTextNode) {
        return '<!-- -->' + escapeTextContentForBrowser(text);
      }
      this.previousWasTextNode = true;
      return escapeTextContentForBrowser(text);
    } else {
      ({child, context} = resolve(child, context));
      if (child === null || child === false) {
        return '';
      } else {
        if (React.isValidElement(child)) {
          return this.renderDOM(child, context);
        } else {
          var children = toArray(child);
          var frame = {
            children,
            childIndex: 0,
            context: context,
            footer: '',
          };
          if (__DEV__) {
            frame.debugElementStack = [];
          }
          this.stack.push(frame);
          return '';
        }
      }
    }
  }

  renderDOM(element, context) {
    var tag = element.type.toLowerCase();

    if (__DEV__) {
      warning(
        tag === element.type,
        '<%s /> is using uppercase HTML. Always use lowercase HTML tags ' +
          'in React.',
        element.type,
      );
    }

    validateDangerousTag(tag);

    var props = element.props;
    if (tag === 'input') {
      if (__DEV__) {
        ReactControlledValuePropTypes.checkPropTypes(
          'input',
          props,
          () => '', //getCurrentFiberStackAddendum
        );

        if (
          props.checked !== undefined &&
          props.defaultChecked !== undefined &&
          !didWarnDefaultChecked
        ) {
          warning(
            false,
            '%s contains an input of type %s with both checked and defaultChecked props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the checked prop, or the defaultChecked prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
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
          warning(
            false,
            '%s contains an input of type %s with both value and defaultValue props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
            'A component',
            props.type,
          );
          didWarnDefaultInputValue = true;
        }
      }

      props = Object.assign(
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
        ReactControlledValuePropTypes.checkPropTypes(
          'textarea',
          props,
          () => '', //getCurrentFiberStackAddendum
        );
        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultTextareaValue
        ) {
          warning(
            false,
            'Textarea elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled textarea ' +
              'and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
          );
          didWarnDefaultTextareaValue = true;
        }
      }

      var initialValue = props.value;
      if (initialValue == null) {
        var defaultValue = props.defaultValue;
        // TODO (yungsters): Remove support for children content in <textarea>.
        var textareaChildren = props.children;
        if (textareaChildren != null) {
          if (__DEV__) {
            warning(
              false,
              'Use the `defaultValue` or `value` props instead of setting ' +
                'children on <textarea>.',
            );
          }
          invariant(
            defaultValue == null,
            'If you supply `defaultValue` on a <textarea>, do not pass children.',
          );
          if (Array.isArray(textareaChildren)) {
            invariant(
              textareaChildren.length <= 1,
              '<textarea> can only have at most one child.',
            );
            textareaChildren = textareaChildren[0];
          }

          defaultValue = '' + textareaChildren;
        }
        if (defaultValue == null) {
          defaultValue = '';
        }
        initialValue = defaultValue;
      }

      props = Object.assign({}, props, {
        value: undefined,
        children: '' + initialValue,
      });
    } else if (tag === 'select') {
      if (__DEV__) {
        ReactControlledValuePropTypes.checkPropTypes(
          'select',
          props,
          () => '', // getCurrentFiberStackAddendum,
        );

        for (var i = 0; i < valuePropNames.length; i++) {
          var propName = valuePropNames[i];
          if (props[propName] == null) {
            continue;
          }
          var isArray = Array.isArray(props[propName]);
          if (props.multiple && !isArray) {
            warning(
              false,
              'The `%s` prop supplied to <select> must be an array if ' +
                '`multiple` is true.%s',
              propName,
              '', // getDeclarationErrorAddendum(),
            );
          } else if (!props.multiple && isArray) {
            warning(
              false,
              'The `%s` prop supplied to <select> must be a scalar ' +
                'value if `multiple` is false.%s',
              propName,
              '', // getDeclarationErrorAddendum(),
            );
          }
        }

        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultSelectValue
        ) {
          warning(
            false,
            'Select elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled select ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
          );
          didWarnDefaultSelectValue = true;
        }
      }
      this.currentSelectValue = props.value != null
        ? props.value
        : props.defaultValue;
      props = Object.assign({}, props, {
        value: undefined,
      });
    } else if (tag === 'option') {
      var selected = null;
      var selectValue = this.currentSelectValue;
      var optionChildren = flattenOptionChildren(props.children);
      if (selectValue != null) {
        var value;
        if (props.value != null) {
          value = props.value + '';
        } else {
          value = optionChildren;
        }
        selected = false;
        if (Array.isArray(selectValue)) {
          // multiple
          for (var j = 0; j < selectValue.length; j++) {
            if ('' + selectValue[j] === value) {
              selected = true;
              break;
            }
          }
        } else {
          selected = '' + selectValue === value;
        }

        props = Object.assign(
          {
            selected: undefined,
            children: undefined,
          },
          props,
          {
            selected: selected,
            children: optionChildren,
          },
        );
      }
    }

    if (__DEV__) {
      validatePropertiesInDevelopment(tag, props);
    }

    assertValidProps(tag, props);

    var out = createOpenTagMarkup(
      element.type,
      tag,
      props,
      this.makeStaticMarkup,
      this.stack.length === 1,
      null,
    );
    var footer = '';
    if (omittedCloseTags.hasOwnProperty(tag)) {
      out += '/>';
    } else {
      out += '>';
      footer = '</' + element.type + '>';
    }
    var children;
    var innerMarkup = getNonChildrenInnerMarkup(props);
    if (innerMarkup != null) {
      children = [];
      if (newlineEatingTags[tag] && innerMarkup.charAt(0) === '\n') {
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
    var frame = {
      tag,
      children,
      childIndex: 0,
      context: context,
      footer: footer,
    };
    if (__DEV__) {
      frame.debugElementStack = [];
    }
    this.stack.push(frame);
    return out;
  }
}

module.exports = ReactDOMServerRenderer;
