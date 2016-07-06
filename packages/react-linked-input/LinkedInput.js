/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var React = require('react');
var LinkedValueUtils = require('react/lib/LinkedValueUtils');

class LinkedInput extends React.Component {
  render() {
    var newProps = Object.assign({}, this.props);
    newProps.value = LinkedValueUtils.getValue(this.props);
    newProps.checked = LinkedValueUtils.getChecked(this.props);
    delete newProps.valueLink;
    delete newProps.checkedLink;
    return React.createElement('input', newProps);
  }
}

module.exports = LinkedInput;

