describe('when Trusted Types are available in global object', () => {
  let React;
  let ReactDOM;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    window.TrustedTypes = {
      isHTML: () => true,
      isScript: () => false,
      isScriptURL: () => false,
      isURL: () => false,
    };
  });

  it('should not stringify trusted values', () => {
    const container = document.createElement('div');
    const trustedObject = {toString: () => 'I look like a trusted object'};
    class Component extends React.Component {
      state = {inner: undefined};
      render() {
        return <div dangerouslySetInnerHTML={{__html: this.state.inner}} />;
      }
    }

    const isHTMLSpy = jest.spyOn(window.TrustedTypes, ['isHTML']);
    const instace = ReactDOM.render(<Component />, container);
    instace.setState({inner: trustedObject});

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
        state = {inner: undefined};
        render() {
          return <svg dangerouslySetInnerHTML={{__html: this.state.inner}} />;
        }
      }
      const errorSpy = spyOnDev(console, 'error');

      const container = document.createElement('div');
      const instace = ReactDOM.render(<Component />, container);
      instace.setState({inner: 'anyValue'});

      if (__DEV__) {
        expect(errorSpy).toHaveBeenCalledWith(
          "Warning: Using 'dangerouslySetInnerHTML' in an svg element with " +
            'Trusted Types enabled in an Internet Explorer will cause ' +
            'the trusted value to be converted to string. Assigning string ' +
            "to 'innerHTML' will throw an error if Trusted Types are enforced. " +
            "You can try to wrap your svg element inside a div and use 'dangerouslySetInnerHTML' " +
            'on the enclosing div instead.',
        );
      }
    });
  });
});
