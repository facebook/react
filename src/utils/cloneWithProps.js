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
 * @typechecks
 * @providesModule cloneWithProps
 */

"use strict";

var ReactPropTransferer = require('ReactPropTransferer');

var keyMirror = require('keyMirror');

var SpecialPropsToTransfer = keyMirror({
  key: null,
  children: null,
  ref: null
});

/**
 * Sometimes you want to change the props of a child passed to you. Usually
 * this is to add a CSS class.
 *
 * @param {object} child child component you'd like to clone
 * @param {object} props props you'd like to modify. They will be merged
 * as if you used `transferPropsTo()`.
 * @return {object} a clone of child with props merged in.
 */
function cloneWithProps(child, props) {
  if (__DEV__) {
    if (child.props.ref) {
      console.warn(
        'You are calling cloneWithProps() on a child with a ref. This is ' +
        'dangerous because you\'re creating a new child which will not be ' +
        'added as a ref to its parent.'
      );
    }
  }

  var newProps = ReactPropTransferer.mergeProps(child.props, props);

  // ReactPropTransferer does not transfer the `key` prop so do it manually. Do
  // not transfer it from the original component.
  if (props.hasOwnProperty(SpecialPropsToTransfer.key)) {
    newProps.key = props.key;
  }

  // ReactPropTransferer does not transfer the `children` prop. Transfer it
  // from `props` if it exists, otherwise use `child.props.children` if it is
  // provided.
  if (props.hasOwnProperty(SpecialPropsToTransfer.children)) {
    newProps.children = props.children;
  } else if (child.props.hasOwnProperty(SpecialPropsToTransfer.children)) {
    newProps.children = child.props.children;
  }

  // ReactPropTransferer does not transfer `ref` so do it manually.
  if (props.hasOwnProperty(SpecialPropsToTransfer.ref)) {
    newProps.ref = props.ref;
  }

  return child.constructor.ConvenienceConstructor(newProps);
}

module.exports = cloneWithProps;
