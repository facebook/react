/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDebugIntrospection', () => {
  var React;
  var ReactDebugInstanceMap;
  var ReactDebugIntrospection;
  var ReactDOM;
  var ReactInstanceMap;

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDebugInstanceMap = require('ReactDebugInstanceMap');
    ReactDebugIntrospection = require('ReactDebugIntrospection');
    ReactDOM = require('ReactDOM');
    ReactInstanceMap = require('ReactInstanceMap');
  });

  function getTree(instanceID, includeOwner) {
    var text = ReactDebugIntrospection.getText(instanceID);
    var result = {
      isComposite: ReactDebugIntrospection.isComposite(instanceID),
      displayName: ReactDebugIntrospection.getDisplayName(instanceID),
      children: ReactDebugIntrospection.getChildIDs(instanceID).map(childID =>
        getTree(childID, includeOwner)
      ),
    };
    if (text !== undefined) {
      result.text = text;
    }
    if (includeOwner) {
      // Owner is going to be removed eventually so we only calculate it
      // for a few focused tests that can later be easily removed.
      var ownerID = ReactDebugIntrospection.unstable_getOwnerID(instanceID);
      if (ownerID) {
        var ownerDisplayName = ReactDebugIntrospection.getDisplayName(ownerID);
        if (ownerDisplayName) {
          result.ownerDisplayName = ownerDisplayName;
        }
      }
    }
    return result;
  }

  function assertTreeMatches(element, expectedTree, includeOwner) {
    var wrapperInst;
    class Wrapper extends React.Component {
      render() {
        wrapperInst = ReactInstanceMap.get(this);
        return element;
      }
    }

    var div = document.createElement('div');
    ReactDOM.render(<Wrapper />, div);
    var instanceID = ReactDebugInstanceMap.getIDForInstance(wrapperInst);
    var tree = getTree(instanceID, includeOwner);
    expect(tree.children[0]).toEqual(expectedTree);

    ReactDOM.unmountComponentAtNode(div);
    tree = getTree(instanceID, includeOwner);
    expect(tree).toEqual({
      isComposite: false,
      displayName: 'Unknown',
      children: [],
    });
  }

  it('returns sane defaults for unknown IDs', () => {
    expect(ReactDebugIntrospection.getText('fake')).toBe(undefined);
    expect(ReactDebugIntrospection.isComposite('fake')).toBe(false);
    expect(ReactDebugIntrospection.getDisplayName('fake')).toBe('Unknown');
    expect(ReactDebugIntrospection.getChildIDs('fake')).toEqual([]);
    expect(ReactDebugIntrospection.unstable_getOwnerID('fake')).toEqual(null);
  });

  it('uses displayName or Unknown for classic components', () => {
    var Foo = React.createClass({
      render() {
        return null;
      },
    });
    Foo.displayName = 'Bar';
    var Baz = React.createClass({
      render() {
        return null;
      },
    });
    var Qux = React.createClass({
      render() {
        return null;
      },
    });
    delete Qux.displayName;

    var element = <div><Foo /><Baz /><Qux /></div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: true,
        displayName: 'Bar',
        children: [],
      }, {
        isComposite: true,
        displayName: 'Baz',
        children: [],        
      }, {
        isComposite: true,
        displayName: 'Unknown',
        children: [],        
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('uses displayName, name, or ReactComponent for modern components', () => {
    class Foo extends React.Component {
      render() {
        return null;
      }
    }
    Foo.displayName = 'Bar';
    class Baz extends React.Component {
      render() {
        return null;
      }
    }
    class Qux extends React.Component {
      render() {
        return null;
      }
    }
    delete Qux.name;

    var element = <div><Foo /><Baz /><Qux /></div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: true,
        displayName: 'Bar',
        children: [],
      }, {
        isComposite: true,
        displayName: 'Baz',
        children: [],        
      }, {
        isComposite: true,
        // Note: Ideally fallback name should be consistent (e.g. "Unknown")
        displayName: 'ReactComponent',
        children: [],        
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('uses displayName, name, or Object for factory components', () => {
    function Foo() {
      return {
        render() {
          return null;
        },
      };
    }
    Foo.displayName = 'Bar';
    function Baz() {
      return {
        render() {
          return null;
        },
      };
    }
    function Qux() {
      return {
        render() {
          return null;
        },
      };
    }
    delete Qux.name;

    var element = <div><Foo /><Baz /><Qux /></div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: true,
        displayName: 'Bar',
        children: [],
      }, {
        isComposite: true,
        displayName: 'Baz',
        children: [],        
      }, {
        isComposite: true,
        // Note: Ideally fallback name should be consistent (e.g. "Unknown")
        displayName: 'Object',
        children: [],        
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('uses displayName, name, or StatelessComponent for functional components', () => {
    function Foo() {
      return null;
    }
    Foo.displayName = 'Bar';
    function Baz() {
      return null;
    }
    function Qux() {
      return null;
    }
    delete Qux.name;

    var element = <div><Foo /><Baz /><Qux /></div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: true,
        displayName: 'Bar',
        children: [],
      }, {
        isComposite: true,
        displayName: 'Baz',
        children: [],        
      }, {
        isComposite: true,
        // Note: Ideally fallback name should be consistent (e.g. "Unknown")
        displayName: 'StatelessComponent',
        children: [],        
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('reports a native tree correctly', () => {
    var element = (
      <div>
        <p>
          <span>
            Hi!
          </span>
          Wow.
        </p>
        <hr />
      </div>
    );
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: 'p',
        children: [{
          isComposite: false,
          displayName: 'span',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi!',
            children: [],
          }],
        }, {
          isComposite: false,
          displayName: '#text',
          text: 'Wow.',
          children: [],
        }],
      }, {
        isComposite: false,
        displayName: 'hr',
        children: [],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('reports a tree with composites correctly', () => {
    var Qux = React.createClass({
      render() {
        return null;
      },
    });
    function Foo() {
      return {
        render() {
          return <Qux />;
        },
      };
    }
    function Bar({children}) {
      return <h1>{children}</h1>;
    }
    class Baz extends React.Component {
      render() {
        return (
          <div>
            <Foo />
            <Bar>
              <span>Hi,</span>
              Mom
            </Bar>
            <a href="#">Click me.</a>
          </div>
        );
      }
    }

    var element = <Baz />;
    var expectedTree = {
      isComposite: true,
      displayName: 'Baz',
      children: [{
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Qux',
            children: [],
          }],
        }, {
          isComposite: true,
          displayName: 'Bar',
          children: [{
            isComposite: false,
            displayName: 'h1',
            children: [{
              isComposite: false,
              displayName: 'span',
              children: [{
                isComposite: false,
                displayName: '#text',
                text: 'Hi,',
                children: [],
              }],
            }, {
              isComposite: false,
              displayName: '#text',
              text: 'Mom',
              children: [],
            }],
          }],
        }, {
          isComposite: false,
          displayName: 'a',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Click me.',
            children: [],
          }],
        }],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('ignores null children', () => {
    class Foo extends React.Component {
      render() {
        return null;
      }
    }
    var element = <Foo />;
    var expectedTree = {
      isComposite: true,
      displayName: 'Foo',
      children: [],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('ignores false children', () => {
    class Foo extends React.Component {
      render() {
        return false;
      }
    }
    var element = <Foo />;
    var expectedTree = {
      isComposite: true,
      displayName: 'Foo',
      children: [],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('reports text nodes as children', () => {
    var element = <div>{'1'}{2}</div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: '#text',
        text: '1',
        children: [],
      }, {
        isComposite: false,
        displayName: '#text',
        text: '2',
        children: [],        
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('reports a single text node as a child', () => {
    var element = <div>{'1'}</div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: '#text',
        text: '1',
        children: [],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('reports a single number node as a child', () => {
    var element = <div>{42}</div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: '#text',
        text: '42',
        children: [],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('does not get fooled by 0 as a text node', () => {
    var element = <div>{0}</div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: '#text',
        text: '0',
        children: [],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('ignores empty text nodes', () => {
    var element = <div>{''}</div>;
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('skips empty nodes for multiple children', () => {
    function Foo() {
      return <div />;
    }
    var element = (
      <div>
        {'hi'}
        {false}
        {42}
        {null}
        <Foo />
      </div>
    );
    var expectedTree = {
      isComposite: false,
      displayName: 'div',
      children: [{
        isComposite: false,
        displayName: '#text',
        text: 'hi',
        children: [],
      }, {
        isComposite: false,
        displayName: '#text',
        text: '42',
        children: [],        
      }, {
        isComposite: true,
        displayName: 'Foo',
        children: [{
          isComposite: false,
          displayName: 'div',
          children: [],
        }],
      }],
    };
    assertTreeMatches(element, expectedTree);
  });

  it('tracks owner correctly', () => {
    class Foo extends React.Component {
      render() {
        return <Bar><h1>Hi.</h1></Bar>;
      }
    }
    function Bar({children}) {
      return <div>{children} Mom</div>;
    }
    
    // Note that owner is not calculated for text nodes
    // because they are not created from real elements.
    var element = <article><Foo /></article>;
    var expectedTree = {
      isComposite: false,
      displayName: 'article',
      children: [{
        isComposite: true,
        displayName: 'Foo',
        children: [{
          isComposite: true,
          displayName: 'Bar',
          ownerDisplayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            ownerDisplayName: 'Bar',
            children: [{
              isComposite: false,
              displayName: 'h1',
              ownerDisplayName: 'Foo',
              children: [{
                isComposite: false,
                displayName: '#text',
                text: 'Hi.',
                children: [],
              }],
            }, {
              isComposite: false,
              displayName: '#text',
              text: ' Mom',
              children: [],
            }],
          }],
        }],
      }],
    };
    assertTreeMatches(element, expectedTree, true);
  });
});
