/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMFiberTextarea
 * @flow
 */

'use strict';

type TextAreaWithWrapperState = HTMLTextAreaElement & {
  _wrapperState: {
    initialValue: string,
  },
};

var ReactControlledValuePropTypes = require('ReactControlledValuePropTypes');
var {getCurrentFiberOwnerName} = require('ReactDebugCurrentFiber');

var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var didWarnValDefaultVal = false;

/**
 * Implements a <textarea> host component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = {
  getHostProps: function(element: Element, props: Object) {
    var node = ((element: any): TextAreaWithWrapperState);
    invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.',
    );

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.  We could add a check in setTextContent
    // to only set the value if/when the value differs from the node value (which would
    // completely solve this IE9 bug), but Sebastian+Ben seemed to like this solution.
    // The value can be a boolean or object so that's why it's forced to be a string.
    var hostProps = Object.assign({}, props, {
      value: undefined,
      defaultValue: undefined,
      children: '' + node._wrapperState.initialValue,
    });

    return hostProps;
  },

  mountWrapper: function(element: Element, props: Object) {
    var node = ((element: any): TextAreaWithWrapperState);
    if (__DEV__) {
      ReactControlledValuePropTypes.checkPropTypes(
        'textarea',
        props,
        getCurrentFiberOwnerName(),
      );
      if (
        props.value !== undefined &&
        props.defaultValue !== undefined &&
        !didWarnValDefaultVal
      ) {
        warning(
          false,
          'Textarea elements must be either controlled or uncontrolled ' +
            '(specify either the value prop, or the defaultValue prop, but not ' +
            'both). Decide between using a controlled or uncontrolled textarea ' +
            'and remove one of these props. More info: ' +
            'https://fb.me/react-controlled-components',
        );
        didWarnValDefaultVal = true;
      }
    }

    var value = props.value;
    var initialValue = value;

    // Only bother fetching default value if we're going to use it
    if (value == null) {
      var defaultValue = props.defaultValue;
      // TODO (yungsters): Remove support for children content in <textarea>.
      var children = props.children;
      if (children != null) {
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
        if (Array.isArray(children)) {
          invariant(
            children.length <= 1,
            '<textarea> can only have at most one child.',
          );
          children = children[0];
        }

        defaultValue = '' + children;
      }
      if (defaultValue == null) {
        defaultValue = '';
      }
      initialValue = defaultValue;
    }

    node._wrapperState = {
      initialValue: '' + initialValue,
    };
  },

  updateWrapper: function(element: Element, props: Object) {
    var node = ((element: any): TextAreaWithWrapperState);
    var value = props.value;
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      var newValue = '' + value;

      // To avoid side effects (such as losing text selection), only set value if changed
      if (newValue !== node.value) {
        node.value = newValue;
      }
      if (props.defaultValue == null) {
        node.defaultValue = newValue;
      }
    }
    if (props.defaultValue != null) {
      node.defaultValue = props.defaultValue;
    }
  },

  postMountWrapper: function(element: Element, props: Object) {
    var node = ((element: any): TextAreaWithWrapperState);
    // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.
    var textContent = node.textContent;

    // Only set node.value if textContent is equal to the expected
    // initial value. In IE10/IE11 there is a bug where the placeholder attribute
    // will populate textContent as well.
    // https://developer.microsoft.com/microsoft-edge/platform/issues/101525/
    if (textContent === node._wrapperState.initialValue) {
      node.value = textContent;
    }
  },

  restoreControlledState: function(element: Element, props: Object) {
    // DOM component is still mounted; update
    ReactDOMTextarea.updateWrapper(element, props);
  },
};

module.exports = ReactDOMTextarea;
