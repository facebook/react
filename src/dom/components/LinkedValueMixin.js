/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule LinkedValueMixin
 * @typechecks static-only
 */

"use strict";

var invariant = require('invariant');

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueMixin = {
  _assertLink: function() {
    invariant(
      this.props.value == null && this.props.onChange == null,
      'Cannot provide a valueLink and a value or onChange event. If you ' +
        'want to use value or onChange, you probably don\'t want to use ' +
        'valueLink'
    );
  },

  /**
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function() {
    if (this.props.valueLink) {
      this._assertLink();
      return this.props.valueLink.value;
    }
    return this.props.value;
  },

  /**
   * @return {function} change callback either from onChange prop or link.
   */
  getOnChange: function() {
    if (this.props.valueLink) {
      this._assertLink();
      return this._handleLinkedValueChange;
    }
    return this.props.onChange;
  },

  /**
   * @param {SyntheticEvent} e change event to handle
   */
  _handleLinkedValueChange: function(e) {
    this.props.valueLink.requestChange(e.target.value);
  }
};

module.exports = LinkedValueMixin;
