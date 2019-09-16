describe('when Trusted Types are available in global object', () => {
  let React;
  let ReactDOM;
  let ReactFeatureFlags;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    window.trustedTypes = {
      isHTML: () => true,
      isScript: () => false,
      isScriptURL: () => false,
    };
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableTrustedTypesIntegration = true;
    React = require('react');
    ReactDOM = require('react-dom');
  });

  afterEach(() => {
    delete window.trustedTypes;
    ReactFeatureFlags.enableTrustedTypesIntegration = false;
  });

  it('should not stringify trusted values', () => {
    const trustedObject = {toString: () => 'I look like a trusted object'};
    class Component extends React.Component {
      state = {inner: undefined};
      render() {
        return <div dangerouslySetInnerHTML={{__html: this.state.inner}} />;
      }
    }

    const isHTMLSpy = jest.spyOn(window.trustedTypes, ['isHTML']);
    const instance = ReactDOM.render(<Component />, container);
    instance.setState({inner: trustedObject});

    expect(container.firstChild.innerHTML).toBe(trustedObject.toString());
    expect(isHTMLSpy).toHaveBeenCalledWith(trustedObject);
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

    it('should log a warning', () => {
      class Component extends React.Component {
        render() {
          return <svg dangerouslySetInnerHTML={{__html: 'unsafe html'}} />;
        }
      }
      expect(() => {
        ReactDOM.render(<Component />, container);
      }).toWarnDev(
        "Warning: Using 'dangerouslySetInnerHTML' in an svg element with " +
          'Trusted Types enabled in an Internet Explorer will cause ' +
          'the trusted value to be converted to string. Assigning string ' +
          "to 'innerHTML' will throw an error if Trusted Types are enforced. " +
          "You can try to wrap your svg element inside a div and use 'dangerouslySetInnerHTML' " +
          'on the enclosing div instead.',
      );
    });
  });

  it('should warn once when rendering script tag in jsx on client', () => {
    expect(() => {
      ReactDOM.render(<script>alert("I am not executed")</script>, container);
    }).toWarnDev(
      'Warning: Encountered a script tag while rendering React component. ' +
        'Scripts inside React components are never executed when rendering ' +
        'on the client. Consider using template tag instead ' +
        '(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).\n' +
        '    in script (at **)',
    );

    // check that the warning is print only once
    ReactDOM.render(<script>alert("I am not executed")</script>, container);
  });
});
