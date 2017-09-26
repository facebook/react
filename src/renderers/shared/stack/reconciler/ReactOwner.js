/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactOwner
 * @flow
 */

'use strict';

var invariant = require('invariant');

import type {ReactInstance} from 'ReactInstanceType';

/**
 * @param {?object} object
 * @return {boolean} True if `object` is a valid owner.
 * @final
 */
function isValidOwner(object: any): boolean {
  return !!(
    object &&
    typeof object.attachRef === 'function' &&
    typeof object.detachRef === 'function'
  );
}

/**
 * ReactOwners are capable of storing references to owned components.
 *
 * All components are capable of //being// referenced by owner components, but
 * only ReactOwner components are capable of //referencing// owned components.
 * The named reference is known as a "ref".
 *
 * Refs are available when mounted and updated during reconciliation.
 *
 *   var MyComponent = React.createClass({
 *     render: function() {
 *       return (
 *         <div onClick={this.handleClick}>
 *           <CustomComponent ref="custom" />
 *         </div>
 *       );
 *     },
 *     handleClick: function() {
 *       this.refs.custom.handleClick();
 *     },
 *     componentDidMount: function() {
 *       this.refs.custom.initialize();
 *     }
 *   });
 *
 * Refs should rarely be used. When refs are used, they should only be done to
 * control data that is not handled by React's data flow.
 *
 * @class ReactOwner
 */
var ReactOwner = {
  /**
   * Adds a component by ref to an owner component.
   *
   * @param {ReactComponent} component Component to reference.
   * @param {string} ref Name by which to refer to the component.
   * @param {ReactOwner} owner Component on which to record the ref.
   * @final
   * @internal
   */
  addComponentAsRefTo: function(
    component: ReactInstance,
    ref: string,
    owner: ReactInstance,
  ): void {
    invariant(
      isValidOwner(owner),
      'addComponentAsRefTo(...): Only a ReactOwner can have refs. You might ' +
        "be adding a ref to a component that was not created inside a component's " +
        '`render` method, or you have multiple copies of React loaded ' +
        '(details: https://fb.me/react-refs-must-have-owner).',
    );
    owner.attachRef(ref, component);
  },

  /**
   * Removes a component by ref from an owner component.
   *
   * @param {ReactComponent} component Component to dereference.
   * @param {string} ref Name of the ref to remove.
   * @param {ReactOwner} owner Component on which the ref is recorded.
   * @final
   * @internal
   */
  removeComponentAsRefFrom: function(
    component: ReactInstance,
    ref: string,
    owner: ReactInstance,
  ): void {
    invariant(
      isValidOwner(owner),
      'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. You might ' +
        "be removing a ref to a component that was not created inside a component's " +
        '`render` method, or you have multiple copies of React loaded ' +
        '(details: https://fb.me/react-refs-must-have-owner).',
    );
    var ownerPublicInstance = owner.getPublicInstance();
    // Check that `component`'s owner is still alive and that `component` is still the current ref
    // because we do not want to detach the ref if another component stole it.
    if (
      ownerPublicInstance &&
      ownerPublicInstance.refs[ref] === component.getPublicInstance()
    ) {
      owner.detachRef(ref);
    }
  },
};

module.exports = ReactOwner;
