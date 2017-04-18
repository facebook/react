/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMSelect
 */

'use strict';

var ReactControlledValuePropTypes = require('ReactControlledValuePropTypes');
var ReactDOMComponentTree = require('ReactDOMComponentTree');

var warning = require('fbjs/lib/warning');

if (__DEV__) {
  var {
    getStackAddendumByID,
  } = require('ReactGlobalSharedState').ReactComponentTreeHook;
}

var didWarnValueDefaultValue = false;

function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return '\n\nCheck the render method of `' + name + '`.';
    }
  }
  return '';
}

var valuePropNames = ['value', 'defaultValue'];

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function checkSelectPropTypes(inst, props) {
  var owner = inst._currentElement._owner;
  ReactControlledValuePropTypes.checkPropTypes('select', props, () =>
    getStackAddendumByID(inst._debugID));

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
        getDeclarationErrorAddendum(owner),
      );
    } else if (!props.multiple && isArray) {
      warning(
        false,
        'The `%s` prop supplied to <select> must be a scalar ' +
          'value if `multiple` is false.%s',
        propName,
        getDeclarationErrorAddendum(owner),
      );
    }
  }
}

/**
 * @param {ReactDOMComponent} inst
 * @param {boolean} multiple
 * @param {*} propValue A stringable (with `multiple`, a list of stringables).
 * @private
 */
function updateOptions(inst, multiple, propValue) {
  var options = ReactDOMComponentTree.getNodeFromInstance(inst).options;

  if (multiple) {
    let selectedValue = {};
    for (let i = 0; i < propValue.length; i++) {
      selectedValue['' + propValue[i]] = true;
    }
    for (let i = 0; i < options.length; i++) {
      var selected = selectedValue.hasOwnProperty(options[i].value);
      if (options[i].selected !== selected) {
        options[i].selected = selected;
      }
    }
  } else {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    let selectedValue = '' + propValue;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === selectedValue) {
        options[i].selected = true;
        return;
      }
    }
    if (options.length) {
      options[0].selected = true;
    }
  }
}

/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = {
  getHostProps: function(inst, props) {
    return Object.assign({}, props, {
      value: undefined,
    });
  },

  mountWrapper: function(inst, props) {
    if (__DEV__) {
      checkSelectPropTypes(inst, props);
    }

    var value = props.value;
    inst._wrapperState = {
      initialValue: value != null ? value : props.defaultValue,
      listeners: null,
      wasMultiple: !!props.multiple,
    };

    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnValueDefaultValue
    ) {
      warning(
        false,
        'Select elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled select ' +
          'element and remove one of these props. More info: ' +
          'https://fb.me/react-controlled-components',
      );
      didWarnValueDefaultValue = true;
    }
  },

  getSelectValueContext: function(inst) {
    // ReactDOMOption looks at this initial value so the initial generated
    // markup has correct `selected` attributes
    return inst._wrapperState.initialValue;
  },

  postUpdateWrapper: function(inst) {
    var props = inst._currentElement.props;

    // After the initial mount, we control selected-ness manually so don't pass
    // this value down
    inst._wrapperState.initialValue = undefined;

    var wasMultiple = inst._wrapperState.wasMultiple;
    inst._wrapperState.wasMultiple = !!props.multiple;

    var value = props.value;
    if (value != null) {
      updateOptions(inst, !!props.multiple, value);
    } else if (wasMultiple !== !!props.multiple) {
      // For simplicity, reapply `defaultValue` if `multiple` is toggled.
      if (props.defaultValue != null) {
        updateOptions(inst, !!props.multiple, props.defaultValue);
      } else {
        // Revert the select back to its default unselected state.
        updateOptions(inst, !!props.multiple, props.multiple ? [] : '');
      }
    }
  },

  restoreControlledState: function(inst) {
    if (inst._rootNodeID) {
      var props = inst._currentElement.props;
      var value = props.value;

      if (value != null) {
        updateOptions(inst, !!props.multiple, value);
      }
    }
  },
};

module.exports = ReactDOMSelect;
