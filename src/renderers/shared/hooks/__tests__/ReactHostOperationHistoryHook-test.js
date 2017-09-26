/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactHostOperationHistoryHook', () => {
  var React;
  var ReactPerf;
  var ReactDOM;
  var ReactDOMComponentTree;
  var ReactDOMFeatureFlags;
  var ReactHostOperationHistoryHook;

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactPerf = require('ReactPerf');
    ReactDOM = require('ReactDOM');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
    ReactHostOperationHistoryHook = require('ReactHostOperationHistoryHook');

    ReactPerf.start();
  });

  afterEach(() => {
    ReactPerf.stop();
  });

  function assertHistoryMatches(expectedHistory) {
    var actualHistory = ReactHostOperationHistoryHook.getHistory();
    expect(actualHistory).toEqual(expectedHistory);
  }

  describe('mount', () => {
    it('gets recorded for host roots', () => {
      var node = document.createElement('div');
      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div><p>Hi.</p></div>, node);

      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'mount',
          payload: ReactDOMFeatureFlags.useCreateElement
            ? 'DIV'
            : '<div data-reactroot="" data-reactid="1"><p data-reactid="2">Hi.</p></div>',
        },
      ]);
    });

    it('gets recorded for composite roots', () => {
      function Foo() {
        return <div><p>Hi.</p></div>;
      }
      var node = document.createElement('div');

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<Foo />, node);

      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'mount',
          payload: ReactDOMFeatureFlags.useCreateElement
            ? 'DIV'
            : '<div data-reactroot="" data-reactid="1">' +
                '<p data-reactid="2">Hi.</p></div>',
        },
      ]);
    });

    it('gets ignored for composite roots that return null', () => {
      function Foo() {
        return null;
      }
      var node = document.createElement('div');

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<Foo />, node);

      // Empty DOM components should be invisible to hooks.
      assertHistoryMatches([]);
    });

    it('gets recorded when a native is mounted deeply instead of null', () => {
      var element;
      function Foo() {
        return element;
      }

      ReactHostOperationHistoryHook._preventClearing = true;

      var node = document.createElement('div');
      element = null;
      ReactDOM.render(<Foo />, node);

      element = <span />;
      ReactDOM.render(<Foo />, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      // Since empty components should be invisible to hooks,
      // we record a "mount" event rather than a "replace with".
      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'mount',
          payload: 'SPAN',
        },
      ]);
    });
  });

  describe('update styles', () => {
    it('gets recorded during mount', () => {
      var node = document.createElement('div');

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(
        <div
          style={{
            color: 'red',
            backgroundColor: 'yellow',
          }}
        />,
        node,
      );

      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
      if (ReactDOMFeatureFlags.useCreateElement) {
        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'update styles',
            payload: {
              color: 'red',
              backgroundColor: 'yellow',
            },
          },
          {
            instanceID: inst._debugID,
            type: 'mount',
            payload: 'DIV',
          },
        ]);
      } else {
        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'mount',
            payload:
              '<div style="color:red;background-color:yellow;" ' +
                'data-reactroot="" data-reactid="1"></div>',
          },
        ]);
      }
    });

    it('gets recorded during an update', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div />, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div style={{color: 'red'}} />, node);
      ReactDOM.render(
        <div
          style={{
            color: 'blue',
            backgroundColor: 'yellow',
          }}
        />,
        node,
      );
      ReactDOM.render(<div style={{backgroundColor: 'green'}} />, node);
      ReactDOM.render(<div />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'update styles',
          payload: {color: 'red'},
        },
        {
          instanceID: inst._debugID,
          type: 'update styles',
          payload: {color: 'blue', backgroundColor: 'yellow'},
        },
        {
          instanceID: inst._debugID,
          type: 'update styles',
          payload: {color: '', backgroundColor: 'green'},
        },
        {
          instanceID: inst._debugID,
          type: 'update styles',
          payload: {backgroundColor: ''},
        },
      ]);
    });

    it('gets ignored if the styles are shallowly equal', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div />, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(
        <div
          style={{
            color: 'red',
            backgroundColor: 'yellow',
          }}
        />,
        node,
      );
      ReactDOM.render(
        <div
          style={{
            color: 'red',
            backgroundColor: 'yellow',
          }}
        />,
        node,
      );

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'update styles',
          payload: {
            color: 'red',
            backgroundColor: 'yellow',
          },
        },
      ]);
    });
  });

  describe('update attribute', () => {
    describe('simple attribute', () => {
      it('gets recorded during mount', () => {
        var node = document.createElement('div');

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div className="rad" tabIndex={42} />, node);

        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
        if (ReactDOMFeatureFlags.useCreateElement) {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {className: 'rad'},
            },
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {tabIndex: 42},
            },
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload: 'DIV',
            },
          ]);
        } else {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload:
                '<div class="rad" tabindex="42" data-reactroot="" ' +
                  'data-reactid="1"></div>',
            },
          ]);
        }
      });

      it('gets recorded during an update', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div />, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div className="rad" />, node);
        ReactDOM.render(<div className="mad" tabIndex={42} />, node);
        ReactDOM.render(<div tabIndex={43} />, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {className: 'rad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {className: 'mad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {tabIndex: 42},
          },
          {
            instanceID: inst._debugID,
            type: 'remove attribute',
            payload: 'className',
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {tabIndex: 43},
          },
        ]);
      });
    });

    describe('attribute that gets removed with certain values', () => {
      it('gets recorded as a removal during an update', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div />, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div disabled={true} />, node);
        ReactDOM.render(<div disabled={false} />, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {disabled: true},
          },
          {
            instanceID: inst._debugID,
            type: 'remove attribute',
            payload: 'disabled',
          },
        ]);
      });
    });

    describe('custom attribute', () => {
      it('gets recorded during mount', () => {
        var node = document.createElement('div');

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div data-x="rad" data-y={42} />, node);

        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
        if (ReactDOMFeatureFlags.useCreateElement) {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {'data-x': 'rad'},
            },
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {'data-y': 42},
            },
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload: 'DIV',
            },
          ]);
        } else {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload:
                '<div data-x="rad" data-y="42" data-reactroot="" ' +
                  'data-reactid="1"></div>',
            },
          ]);
        }
      });

      it('gets recorded during an update', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div />, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div data-x="rad" />, node);
        ReactDOM.render(<div data-x="mad" data-y={42} />, node);
        ReactDOM.render(<div data-y={43} />, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {'data-x': 'rad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {'data-x': 'mad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {'data-y': 42},
          },
          {
            instanceID: inst._debugID,
            type: 'remove attribute',
            payload: 'data-x',
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {'data-y': 43},
          },
        ]);
      });
    });

    describe('attribute on a web component', () => {
      it('gets recorded during mount', () => {
        var node = document.createElement('div');

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<my-component className="rad" tabIndex={42} />, node);

        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
        if (ReactDOMFeatureFlags.useCreateElement) {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {className: 'rad'},
            },
            {
              instanceID: inst._debugID,
              type: 'update attribute',
              payload: {tabIndex: 42},
            },
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload: 'MY-COMPONENT',
            },
          ]);
        } else {
          assertHistoryMatches([
            {
              instanceID: inst._debugID,
              type: 'mount',
              payload:
                '<my-component className="rad" tabIndex="42" ' +
                  'data-reactroot="" data-reactid="1"></my-component>',
            },
          ]);
        }
      });

      it('gets recorded during an update', () => {
        var node = document.createElement('div');
        ReactDOM.render(<my-component />, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<my-component className="rad" />, node);
        ReactDOM.render(<my-component className="mad" tabIndex={42} />, node);
        ReactDOM.render(<my-component tabIndex={43} />, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {className: 'rad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {className: 'mad'},
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {tabIndex: 42},
          },
          {
            instanceID: inst._debugID,
            type: 'remove attribute',
            payload: 'className',
          },
          {
            instanceID: inst._debugID,
            type: 'update attribute',
            payload: {tabIndex: 43},
          },
        ]);
      });
    });
  });

  describe('replace text', () => {
    describe('text content', () => {
      it('gets recorded during an update from text content', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div>Hi.</div>, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>Bye.</div>, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'replace text',
            payload: 'Bye.',
          },
        ]);
      });

      it('gets recorded during an update from html', () => {
        var node = document.createElement('div');
        ReactDOM.render(
          <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />,
          node,
        );
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>Bye.</div>, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'replace text',
            payload: 'Bye.',
          },
        ]);
      });

      it('gets recorded during an update from children', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div><span /><p /></div>, node);
        var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>Bye.</div>, node);

        assertHistoryMatches([
          {
            instanceID: inst._debugID,
            type: 'remove child',
            payload: {fromIndex: 0},
          },
          {
            instanceID: inst._debugID,
            type: 'remove child',
            payload: {fromIndex: 1},
          },
          {
            instanceID: inst._debugID,
            type: 'replace text',
            payload: 'Bye.',
          },
        ]);
      });

      it('gets ignored if new text is equal', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div>Hi.</div>, node);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>Hi.</div>, node);

        assertHistoryMatches([]);
      });
    });

    describe('text node', () => {
      it('gets recorded during an update', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div>{'Hi.'}{42}</div>, node);
        var inst1 = ReactDOMComponentTree.getInstanceFromNode(
          node.firstChild.childNodes[0],
        );
        var inst2 = ReactDOMComponentTree.getInstanceFromNode(
          node.firstChild.childNodes[3],
        );

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>{'Bye.'}{43}</div>, node);

        assertHistoryMatches([
          {
            instanceID: inst1._debugID,
            type: 'replace text',
            payload: 'Bye.',
          },
          {
            instanceID: inst2._debugID,
            type: 'replace text',
            payload: '43',
          },
        ]);
      });

      it('gets ignored if new text is equal', () => {
        var node = document.createElement('div');
        ReactDOM.render(<div>{'Hi.'}{42}</div>, node);

        ReactHostOperationHistoryHook._preventClearing = true;
        ReactDOM.render(<div>{'Hi.'}{42}</div>, node);

        assertHistoryMatches([]);
      });
    });
  });

  describe('replace with', () => {
    it('gets recorded when composite renders to a different type', () => {
      var element;
      function Foo() {
        return element;
      }

      var node = document.createElement('div');
      element = <div />;
      ReactDOM.render(<Foo />, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      element = <span />;

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<Foo />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'replace with',
          payload: 'SPAN',
        },
      ]);
    });

    it('gets recorded when composite renders to null after a native', () => {
      var element;
      function Foo() {
        return element;
      }

      var node = document.createElement('div');
      element = <span />;
      ReactDOM.render(<Foo />, node);

      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);
      element = null;

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<Foo />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'replace with',
          payload: '#comment',
        },
      ]);
    });

    it('gets ignored if the type has not changed', () => {
      var element;
      function Foo() {
        return element;
      }

      var node = document.createElement('div');
      element = <div />;
      ReactDOM.render(<Foo />, node);

      element = <div />;

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<Foo />, node);

      assertHistoryMatches([]);
    });
  });

  describe('replace children', () => {
    it('gets recorded during an update from text content', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div>Hi.</div>, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Bye.'}} />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'replace children',
          payload: 'Bye.',
        },
      ]);
    });

    it('gets recorded during an update from html', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Hi.'}} />, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Bye.'}} />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'replace children',
          payload: 'Bye.',
        },
      ]);
    });

    it('gets recorded during an update from children', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div><span /><p /></div>, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Hi.'}} />, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'remove child',
          payload: {fromIndex: 0},
        },
        {
          instanceID: inst._debugID,
          type: 'remove child',
          payload: {fromIndex: 1},
        },
        {
          instanceID: inst._debugID,
          type: 'replace children',
          payload: 'Hi.',
        },
      ]);
    });

    it('gets ignored if new html is equal', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Hi.'}} />, node);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div dangerouslySetInnerHTML={{__html: 'Hi.'}} />, node);

      assertHistoryMatches([]);
    });
  });

  describe('insert child', () => {
    it('gets reported when a child is inserted', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div><span /></div>, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div><span /><p /></div>, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'insert child',
          payload: {toIndex: 1, content: 'P'},
        },
      ]);
    });
  });

  describe('move child', () => {
    it('gets reported when a child is inserted', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div><span key="a" /><p key="b" /></div>, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div><p key="b" /><span key="a" /></div>, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'move child',
          payload: {fromIndex: 0, toIndex: 1},
        },
      ]);
    });
  });

  describe('remove child', () => {
    it('gets reported when a child is removed', () => {
      var node = document.createElement('div');
      ReactDOM.render(<div><span key="a" /><p key="b" /></div>, node);
      var inst = ReactDOMComponentTree.getInstanceFromNode(node.firstChild);

      ReactHostOperationHistoryHook._preventClearing = true;
      ReactDOM.render(<div><span key="a" /></div>, node);

      assertHistoryMatches([
        {
          instanceID: inst._debugID,
          type: 'remove child',
          payload: {fromIndex: 1},
        },
      ]);
    });
  });
});
