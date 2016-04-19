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

describe('ReactDebugTool', () => {












  /*
   TODO:
    * Make sure update and unmount paths are tested
    * Make sure server rendering works the same way
    * Enable all existing tests
    * Remove ReactInstanceMap usage
    */











  var React;
  var ReactDebugTool;
  var ReactDOM;
  var ReactInstanceMap;

  var devtool;

  function createDevtool() {
    var tree = {};

    function updateTree(debugID, update) {
      if (!tree[debugID]) {
        tree[debugID] = {};
      }
      update(tree[debugID]);
    }

    var devtool = {
      onSetIsComposite(debugID, isComposite) {
        updateTree(debugID, item => item.isComposite = isComposite);
      },
      onSetDisplayName(debugID, displayName) {
        updateTree(debugID, item => item.displayName = displayName);
      },
      onSetChildren(debugID, childDebugIDs) {
        updateTree(debugID, item => item.childDebugIDs = childDebugIDs);
      },
      onSetOwner(debugID, ownerDebugID) {
        updateTree(debugID, item => item.ownerDebugID = ownerDebugID);
      },
      onSetText(debugID, text) {
        updateTree(debugID, item => item.text = text);
      },
      getTree(debugID, includeOwner) {
        var item = tree[debugID];
        var result = {
          isComposite: item.isComposite,
          displayName: item.displayName,
        };
        result.children = item.childDebugIDs.map(childDebugID =>
          devtool.getTree(childDebugID, includeOwner)
        );
        if (item.text != null) {
          result.text = item.text;
        }
        if (includeOwner && item.ownerDebugID) {
          result.ownerDisplayName = tree[item.ownerDebugID].displayName;
        }
        return result;
      }
    };

    return devtool;
  }

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactDebugTool = require('ReactDebugTool');
    ReactDOM = require('ReactDOM');
    ReactInstanceMap = require('ReactInstanceMap');

    devtool = createDevtool();
    ReactDebugTool.addDevtool(devtool);
  });

  afterEach(() => {
    ReactDebugTool.removeDevtool(devtool);
  });

  function assertTreeMatches(element, expectedTree, includeOwner) {
    class Wrapper extends React.Component {
      render() {
        return element;
      }
    }

    var node = document.createElement('div');
    var rootPublicInstance = ReactDOM.render(<Wrapper />, node);
    var rootInstance = ReactInstanceMap.get(rootPublicInstance);
    var actualTree = devtool.getTree(
      rootInstance._renderedComponent._debugID,
      includeOwner
    );
    expect(actualTree).toEqual(expectedTree);
  }

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
        displayName: 'Unknown',
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
        displayName: 'Unknown',
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

  it('reports a simple tree with composites correctly', () => {
    class Foo extends React.Component {
      render() {
        return <div />;
      }
    }

    var element = <Foo />;
    var expectedTree = {
      isComposite: true,
      displayName: 'Foo',
      children: [{
        isComposite: false,
        displayName: 'div',
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
        text: 2,
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
        text: 42,
        children: [],
      }],
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
        text: 42,
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
