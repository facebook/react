/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactOwner
 * @flow
 */

'use strict';

var { ClassComponent } = require('ReactTypeOfWork');

var emptyObject = require('fbjs/lib/emptyObject');
var invariant = require('fbjs/lib/invariant');

import type { Fiber } from 'ReactFiber';
import type { ReactInstance } from 'ReactInstanceType';

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
    owner: ReactInstance | Fiber,
  ): void {
    if (owner && (owner : any).tag === ClassComponent) {
      const inst = (owner : any).stateNode;
      const refs = inst.refs === emptyObject ? (inst.refs = {}) : inst.refs;
      refs[ref] = component.getPublicInstance();
    } else {
      invariant(
        isValidOwner(owner),
        'addComponentAsRefTo(...): Only a ReactOwner can have refs. You might ' +
        'be adding a ref to a component that was not created inside a component\'s ' +
        '`render` method, or you have multiple copies of React loaded ' +
        '(details: https://fb.me/react-refs-must-have-owner).'
      );
      (owner : any).attachRef(ref, component);
    }
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
    owner: ReactInstance | Fiber,
  ): void {
    if (owner && (owner : any).tag === ClassComponent) {
      const inst = (owner : any).stateNode;
      if (inst && inst.refs[ref] === component.getPublicInstance()) {
        delete inst.refs[ref];
      }
    } else {
      invariant(
        isValidOwner(owner),
        'removeComponentAsRefFrom(...): Only a ReactOwner can have refs. You might ' +
        'be removing a ref to a component that was not created inside a component\'s ' +
        '`render` method, or you have multiple copies of React loaded ' +
        '(details: https://fb.me/react-refs-must-have-owner).'
      );
      var ownerPublicInstance = (owner : any).getPublicInstance();
      // Check that `component`'s owner is still alive and that `component` is still the current ref
      // because we do not want to detach the ref if another component stole it.
      if (ownerPublicInstance && ownerPublicInstance.refs[ref] === component.getPublicInstance()) {
        (owner : any).detachRef(ref);
      }
    }
  },

};

module.exports = ReactOwner;
