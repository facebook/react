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
 * @jsx React.DOM
 * @emails react-core
 */

describe('ReactMultiChild', function() {
  var React;
  var setInnerHTML;

  // Only run this test suite if `Element.prototype.innerHTML` can be spied on.
  var innerHTMLDescriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'innerHTML'
  );
  if (!innerHTMLDescriptor) {
    return;
  }

  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');

    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: setInnerHTML = jasmine.createSpy().andCallFake(
        innerHTMLDescriptor.set
      )
    });
  });

  it('should only set `innerHTML` once on update', function() {
    var container = document.createElement('div');

    React.renderComponent(
      <div>
        <p><span /></p>
        <p><span /></p>
        <p><span /></p>
      </div>,
      container
    );
    // Warm the cache used by `getMarkupWrap`.
    React.renderComponent(
      <div>
        <p><span /><span /></p>
        <p><span /><span /></p>
        <p><span /><span /></p>
      </div>,
      container
    );
    expect(setInnerHTML).toHaveBeenCalled();
    var callCountOnMount = setInnerHTML.callCount;

    React.renderComponent(
      <div>
        <p><span /><span /><span /></p>
        <p><span /><span /><span /></p>
        <p><span /><span /><span /></p>
      </div>,
      container
    );
    expect(setInnerHTML.callCount).toBe(callCountOnMount + 1);
  });
});
