/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule createHierarchyRenderer
 */

var React = require('React');

/**
 * Creates a render method that makes it easier to create, render, and inspect a
 * hierarchy of mock React component classes.
 *
 * A component class is created for each of the supplied render methods. Each
 * render method is invoked with the classes created using the render methods
 * that come after it in the supplied list of render methods.
 *
 *   var renderHierarchy = createHierarchyRenderer(
 *     function ComponentA(ComponentB, ComponentC) {...},
 *     function ComponentB(ComponentC) {...},
 *     function ComponentC() {...}
 *   );
 *
 * When the hierarchy is invoked, a two-dimensional array is returned. Each
 * array corresponds to a supplied render method and contains the instances
 * returned by that render method in the order it was invoked.
 *
 *   var instances = renderHierarchy(
 *     function(ComponentA[, ComponentB, ComponentC]) {
 *       React.renderComponent(<ComponentA />, ...);
 *     })
 *   );
 *   instances[0][0]; // First return value of first render method.
 *   instances[1][0]; // First return value of second render method.
 *   instances[1][1]; // Second return value of second render method.
 *
 * Refs should be used to reference components that are not the return value of
 * render methods.
 *
 *   expect(instances[0][0].refs.X).toBe(...);
 *
 * NOTE: The component classes created for each render method are re-used for
 * each invocation of the hierarchy renderer. If new classes are needed, you
 * should re-execute `createHierarchyRenderer` with the same arguments.
 *
 * @param {array<function>} ...renderMethods
 * @return {function}
 */
function createHierarchyRenderer(...renderMethods) {
  var instances;
  var Components = renderMethods.reduceRight(
    function(Components, renderMethod, depth) {
      var Component = React.createClass({
        displayName: renderMethod.name,
        render: function() {
          instances[depth].push(this);
          return renderMethod.apply(this, Components);
        }
      });
      return [Component].concat(Components);
    },
    []
  );
  /**
   * @param {function} renderComponent
   * @return {array<array<*>>}
   */
  function renderHierarchy(renderComponent) {
    instances = renderMethods.map(() => []);
    renderComponent.apply(null, Components);
    return instances;
  }
  return renderHierarchy;
}

module.exports = createHierarchyRenderer;
