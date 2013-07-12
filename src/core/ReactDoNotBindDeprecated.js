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
