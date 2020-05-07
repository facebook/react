describe('when Trusted Types are passed as parameter to ReactDOM', () => {
  let React;
  let ReactDOMServer;
  let TrustedTypes;
  let getPropertyTypeSpy;

  beforeEach(() => {
    React = require('react');
    ReactDOMServer = require('react-dom/server');
    TrustedTypes = {
      isHTML: value => value.toString() === 'TRUSTED',
      isScript: () => true,
      isScriptURL: () => true,
      isURL: () => true,
      getPropertyType: (elem, prop) => {
        if (elem === 'div' && prop === 'innerHTML') {
          return 'TrustedHTML';
        } else {
          return undefined;
        }
      },
    };
    getPropertyTypeSpy = jest.spyOn(TrustedTypes, 'getPropertyType');
  });

  describe('rendering safe properties', () => {
    it('renders using renderToString method', () => {
      const html = ReactDOMServer.renderToString(
        <div foo="foo" />,
        TrustedTypes,
      );
      expect(html).toBe('<div foo="foo" data-reactroot=""></div>');
      expect(getPropertyTypeSpy).toHaveBeenCalledWith('div', 'foo');
    });

    it('renders using renderToStaticMarkup method', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <div foo="foo" />,
        TrustedTypes,
      );
      expect(html).toBe('<div foo="foo"></div>');
      expect(getPropertyTypeSpy).toHaveBeenCalledWith('div', 'foo');
    });

    it('renders using renderToNodeStream method', () => {
      const stream = ReactDOMServer.renderToNodeStream(
        <div foo="foo" />,
        TrustedTypes,
      ).setEncoding('utf8');
      expect(stream.read()).toBe('<div foo="foo" data-reactroot=""></div>');
      expect(getPropertyTypeSpy).toHaveBeenCalledWith('div', 'foo');
    });

    it('renders using renderToStaticNodeStream method', () => {
      const stream = ReactDOMServer.renderToStaticNodeStream(
        <div foo="foo" />,
        TrustedTypes,
      ).setEncoding('utf8');
      expect(stream.read()).toBe('<div foo="foo"></div>');
      expect(getPropertyTypeSpy).toHaveBeenCalledWith('div', 'foo');
    });
  });

  describe('assigning trusted values into execution sinks', () => {
    let trustedValue;
    let isHTMLSpy;

    beforeEach(() => {
      trustedValue = {toString: () => 'TRUSTED'};
      isHTMLSpy = jest.spyOn(TrustedTypes, 'isHTML');
    });

    it('renders using renderToString method', () => {
      const html = ReactDOMServer.renderToString(
        <div dangerouslySetInnerHTML={{__html: trustedValue}} />,
        TrustedTypes,
      );
      expect(html).toBe('<div data-reactroot="">TRUSTED</div>');
      expect(isHTMLSpy).toHaveBeenCalledWith(trustedValue);
    });

    it('renders using renderToStaticMarkup method', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <div dangerouslySetInnerHTML={{__html: trustedValue}} />,
        TrustedTypes,
      );
      expect(html).toBe('<div>TRUSTED</div>');
      expect(isHTMLSpy).toHaveBeenCalledWith(trustedValue);
    });

    it('renders using renderToNodeStream method', () => {
      const stream = ReactDOMServer.renderToNodeStream(
        <div dangerouslySetInnerHTML={{__html: trustedValue}} />,
        TrustedTypes,
      ).setEncoding('utf8');
      expect(stream.read()).toBe('<div data-reactroot="">TRUSTED</div>');
      expect(isHTMLSpy).toHaveBeenCalledWith(trustedValue);
    });

    it('renders using renderToStaticNodeStream method', () => {
      const stream = ReactDOMServer.renderToStaticNodeStream(
        <div dangerouslySetInnerHTML={{__html: trustedValue}} />,
        TrustedTypes,
      ).setEncoding('utf8');
      expect(stream.read()).toBe('<div>TRUSTED</div>');
      expect(isHTMLSpy).toHaveBeenCalledWith(trustedValue);
    });
  });

  describe('when untrusted values are assigned to execution sinks', () => {
    let untrustedValue;
    let isHTMLSpy;

    beforeEach(() => {
      untrustedValue = {toString: () => 'untrusted'};
      isHTMLSpy = jest.spyOn(TrustedTypes, 'isHTML');
    });

    it('throws when using renderToString method', () => {
      expect(() => {
        ReactDOMServer.renderToString(
          <div dangerouslySetInnerHTML={{__html: untrustedValue}} />,
          TrustedTypes,
        );
      }).toThrow();
      expect(isHTMLSpy).toHaveBeenCalledWith(untrustedValue);
    });

    it('throws when using renderToStaticMarkup method', () => {
      expect(() => {
        ReactDOMServer.renderToStaticMarkup(
          <div dangerouslySetInnerHTML={{__html: untrustedValue}} />,
          TrustedTypes,
        );
      }).toThrow();
      expect(isHTMLSpy).toHaveBeenCalledWith(untrustedValue);
    });

    it('throws when using renderToNodeStream method', () => {
      const response = ReactDOMServer.renderToNodeStream(
        <div dangerouslySetInnerHTML={{__html: untrustedValue}} />,
        TrustedTypes,
      ).setEncoding('utf8');

      return new Promise(resolve => {
        response.once('error', () => {
          resolve();
        });
        expect(response.read()).toBeNull();
        expect(isHTMLSpy).toHaveBeenCalledWith(untrustedValue);
      });
    });

    it('throws when using renderToStaticNodeStream method', () => {
      const response = ReactDOMServer.renderToStaticNodeStream(
        <div dangerouslySetInnerHTML={{__html: untrustedValue}} />,
        TrustedTypes,
      ).setEncoding('utf8');

      return new Promise(resolve => {
        response.once('error', () => {
          resolve();
        });
        expect(response.read()).toBeNull();
        expect(isHTMLSpy).toHaveBeenCalledWith(untrustedValue);
      });
    });
  });
});
