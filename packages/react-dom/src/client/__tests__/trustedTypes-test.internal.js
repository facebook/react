/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('when Trusted Types are available in global object', () => {
  let React;
  let ReactDOM;
  let ReactFeatureFlags;
  let container;
  let ttObject1;
  let ttObject2;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    const fakeTTObjects = new Set();
    window.trustedTypes = {
      isHTML: function (value) {
        if (this !== window.trustedTypes) {
          throw new Error(this);
        }
        return fakeTTObjects.has(value);
      },
      isScript: () => false,
      isScriptURL: () => false,
    };
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableTrustedTypesIntegration = true;
    React = require('react');
    ReactDOM = require('react-dom');
    ttObject1 = {
      toString() {
        return '<b>Hi</b>';
      },
    };
    ttObject2 = {
      toString() {
        return '<b>Bye</b>';
      },
    };
    fakeTTObjects.add(ttObject1);
    fakeTTObjects.add(ttObject2);
  });

  afterEach(() => {
    delete window.trustedTypes;
  });

  it('should not stringify trusted values for dangerouslySetInnerHTML', () => {
    const innerHTMLDescriptor = Object.getOwnPropertyDescriptor(
      Element.prototype,
      'innerHTML',
    );
    try {
      const innerHTMLCalls = [];
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get() {
          return innerHTMLDescriptor.get.apply(this, arguments);
        },
        set(value) {
          innerHTMLCalls.push(value);
          return innerHTMLDescriptor.set.apply(this, arguments);
        },
      });
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: ttObject1}} />,
        container,
      );
      expect(container.innerHTML).toBe('<div><b>Hi</b></div>');
      expect(innerHTMLCalls.length).toBe(1);
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(innerHTMLCalls[0]).toBe(ttObject1);

      innerHTMLCalls.length = 0;
      ReactDOM.render(
        <div dangerouslySetInnerHTML={{__html: ttObject2}} />,
        container,
      );
      expect(container.innerHTML).toBe('<div><b>Bye</b></div>');
      expect(innerHTMLCalls.length).toBe(1);
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(innerHTMLCalls[0]).toBe(ttObject2);
    } finally {
      Object.defineProperty(
        Element.prototype,
        'innerHTML',
        innerHTMLDescriptor,
      );
    }
  });

  it('should not stringify trusted values for setAttribute (unknown attribute)', () => {
    const setAttribute = Element.prototype.setAttribute;
    try {
      const setAttributeCalls = [];
      Element.prototype.setAttribute = function (name, value) {
        setAttributeCalls.push([this, name.toLowerCase(), value]);
        return setAttribute.apply(this, arguments);
      };
      ReactDOM.render(<div data-foo={ttObject1} />, container);
      expect(container.innerHTML).toBe('<div data-foo="<b>Hi</b>"></div>');
      expect(setAttributeCalls.length).toBe(1);
      expect(setAttributeCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeCalls[0][1]).toBe('data-foo');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeCalls[0][2]).toBe(ttObject1);

      setAttributeCalls.length = 0;
      ReactDOM.render(<div data-foo={ttObject2} />, container);
      expect(setAttributeCalls.length).toBe(1);
      expect(setAttributeCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeCalls[0][1]).toBe('data-foo');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeCalls[0][2]).toBe(ttObject2);
    } finally {
      Element.prototype.setAttribute = setAttribute;
    }
  });

  it('should not stringify trusted values for setAttribute (known attribute)', () => {
    const setAttribute = Element.prototype.setAttribute;
    try {
      const setAttributeCalls = [];
      Element.prototype.setAttribute = function (name, value) {
        setAttributeCalls.push([this, name.toLowerCase(), value]);
        return setAttribute.apply(this, arguments);
      };
      ReactDOM.render(<div className={ttObject1} />, container);
      expect(container.innerHTML).toBe('<div class="<b>Hi</b>"></div>');
      expect(setAttributeCalls.length).toBe(1);
      expect(setAttributeCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeCalls[0][1]).toBe('class');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeCalls[0][2]).toBe(ttObject1);

      setAttributeCalls.length = 0;
      ReactDOM.render(<div className={ttObject2} />, container);
      expect(setAttributeCalls.length).toBe(1);
      expect(setAttributeCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeCalls[0][1]).toBe('class');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeCalls[0][2]).toBe(ttObject2);
    } finally {
      Element.prototype.setAttribute = setAttribute;
    }
  });

  it('should not stringify trusted values for setAttributeNS', () => {
    const setAttributeNS = Element.prototype.setAttributeNS;
    try {
      const setAttributeNSCalls = [];
      Element.prototype.setAttributeNS = function (ns, name, value) {
        setAttributeNSCalls.push([this, ns, name, value]);
        return setAttributeNS.apply(this, arguments);
      };
      ReactDOM.render(<svg xlinkHref={ttObject1} />, container);
      expect(container.innerHTML).toBe('<svg xlink:href="<b>Hi</b>"></svg>');
      expect(setAttributeNSCalls.length).toBe(1);
      expect(setAttributeNSCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeNSCalls[0][1]).toBe('http://www.w3.org/1999/xlink');
      expect(setAttributeNSCalls[0][2]).toBe('xlink:href');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeNSCalls[0][3]).toBe(ttObject1);

      setAttributeNSCalls.length = 0;
      ReactDOM.render(<svg xlinkHref={ttObject2} />, container);
      expect(setAttributeNSCalls.length).toBe(1);
      expect(setAttributeNSCalls[0][0]).toBe(container.firstChild);
      expect(setAttributeNSCalls[0][1]).toBe('http://www.w3.org/1999/xlink');
      expect(setAttributeNSCalls[0][2]).toBe('xlink:href');
      // Ensure it didn't get stringified when passed to a DOM sink:
      expect(setAttributeNSCalls[0][3]).toBe(ttObject2);
    } finally {
      Element.prototype.setAttributeNS = setAttributeNS;
    }
  });

  describe('dangerouslySetInnerHTML in svg elements in Internet Explorer', () => {
    let innerHTMLDescriptor;

    // simulate svg elements in Internet Explorer which don't have 'innerHTML' property
    beforeEach(() => {
      innerHTMLDescriptor = Object.getOwnPropertyDescriptor(
        Element.prototype,
        'innerHTML',
      );
      delete Element.prototype.innerHTML;
      Object.defineProperty(
        HTMLDivElement.prototype,
        'innerHTML',
        innerHTMLDescriptor,
      );
    });

    afterEach(() => {
      delete HTMLDivElement.prototype.innerHTML;
      Object.defineProperty(
        Element.prototype,
        'innerHTML',
        innerHTMLDescriptor,
      );
    });

    // @gate !disableIEWorkarounds
    it('should log a warning', () => {
      class Component extends React.Component {
        render() {
          return <svg dangerouslySetInnerHTML={{__html: 'unsafe html'}} />;
        }
      }
      expect(() => {
        ReactDOM.render(<Component />, container);
      }).toErrorDev(
        "Warning: Using 'dangerouslySetInnerHTML' in an svg element with " +
          'Trusted Types enabled in an Internet Explorer will cause ' +
          'the trusted value to be converted to string. Assigning string ' +
          "to 'innerHTML' will throw an error if Trusted Types are enforced. " +
          "You can try to wrap your svg element inside a div and use 'dangerouslySetInnerHTML' " +
          'on the enclosing div instead.',
      );
      expect(container.innerHTML).toBe('<svg>unsafe html</svg>');
    });
  });

  it('should warn once when rendering script tag in jsx on client', () => {
    expect(() => {
      ReactDOM.render(<script>alert("I am not executed")</script>, container);
    }).toErrorDev(
      'Warning: Encountered a script tag while rendering React component. ' +
        'Scripts inside React components are never executed when rendering ' +
        'on the client. Consider using template tag instead ' +
        '(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).\n' +
        '    in script (at **)',
    );

    // check that the warning is printed only once
    ReactDOM.render(<script>alert("I am not executed")</script>, container);
  });
});
