/**
 * Copyright 2014 Facebook, Inc.
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
 * @providesModule ReactEmptyComponent
 */

"use strict";

var ReactEmptyComponentInjection = {
  injectEmptyComponent: function(component) {
    ReactEmptyComponent._component = component;
  }
};

/**
 * Returns the same component, or the injected empty component.
 * @param {ReactComponent} component the potential component to return
 * @return {ReactComponent} either the component itself, or
 * ReactEmptyComponent._component
 */
function returnSameComponentOrEmptyComponent(component) {
  if (component) {
    return component;
  }
  return ReactEmptyComponent._component();
}

var ReactEmptyComponent = {
  _component: null,
  injection: ReactEmptyComponentInjection,
  returnSameComponentOrEmptyComponent: returnSameComponentOrEmptyComponent
};

module.exports = ReactEmptyComponent;
