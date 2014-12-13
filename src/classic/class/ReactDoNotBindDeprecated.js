/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDoNotBindDeprecated
 */

"use strict";

var ReactDoNotBindDeprecated = {
  /**
   * Marks the method for not being automatically bound on component mounting. A
   * couple of reasons you might want to use this:
   *
   * - Automatically supporting the previous behavior in components that were
   *   built with previous versions of React.
   * - Tuning performance, by avoiding binding on initial render for methods
   *   that are always invoked while being preceded by `this.`. Such binds are
   *   unnecessary.
   *
   *   React.createClass({
   *     handleClick: ReactDoNotBindDeprecated.doNotBind(function() {
   *       alert(this.setState); // undefined!
   *     }),
   *     render: function() {
   *       return <a onClick={this.handleClick}>Jump</a>;
   *     }
   *   });
   *
   * @param {function} method Method to avoid automatically binding.
   * @public
   */
  doNotBind: function(method) {
    method.__reactDontBind = true;   // Mutating
    return method;
  }
};

module.exports = ReactDoNotBindDeprecated;
