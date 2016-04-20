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
  var React;
  var ReactDebugTool;
  var ReactDOM;
  var ReactInstanceMap;

  var devtool;

  function createDevtool() {
    var tree = {};

    function updateTree(id, update) {
      if (!tree[id]) {
        tree[id] = {};
      }
      update(tree[id]);
    }

    function getTree(id, includeOwner) {
      var item = tree[id];
      var result = {
        isComposite: item.isComposite,
        displayName: item.displayName,
      };
      if (item.childIDs) {
        result.children = item.childIDs.map(childID =>
          getTree(childID, includeOwner)
        );
      }
      if (item.text != null) {
        result.text = item.text;
      }
      if (includeOwner && item.ownerDebugID) {
        result.ownerDisplayName = tree[item.ownerDebugID].displayName;
      }
      return result;
    }

    function purgeTree(id) {
      var item = tree[id];
      if (!item) {
        return;
      }

      var {childIDs} = item;
      delete tree[id];

      if (childIDs) {
        childIDs.forEach(purgeTree);
      }
    }

    return {
      onSetIsComposite(id, isComposite) {
        updateTree(id, item => item.isComposite = isComposite);
      },

      onSetDisplayName(id, displayName) {
        updateTree(id, item => item.displayName = displayName);
      },

      onSetChildren(id, childIDs) {
        childIDs.forEach(childID => {
          var childItem = tree[childID];
          expect(childItem).toBeDefined();
          expect(childItem.isComposite).toBeDefined();
          expect(childItem.displayName).toBeDefined();
          expect(childItem.childIDs || childItem.text).toBeDefined();
        });

        updateTree(id, item => item.childIDs = childIDs);
      },

      onSetOwner(id, ownerDebugID) {
        updateTree(id, item => item.ownerDebugID = ownerDebugID);
      },

      onSetText(id, text) {
        updateTree(id, item => item.text = text);
      },

      onUnmountComponent(id) {
        purgeTree(id);
      },

      getRegisteredDebugIDs() {
        return Object.keys(tree);
      },

      getTree(rootDebugID, includeOwner) {
        return getTree(rootDebugID, includeOwner);
      },
    };
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

  function assertTreeMatches(pairs, includeOwner) {
    if (!Array.isArray(pairs[0])) {
      pairs = [pairs];
    }

    var currentElement;
    class Wrapper extends React.Component {
      render() {
        return currentElement;
      }
    }

    var node = document.createElement('div');

    pairs.forEach(([element, expectedTree]) => {
      currentElement = element;

      var rootPublicInstance = ReactDOM.render(<Wrapper />, node);
      var rootInstance = ReactInstanceMap.get(rootPublicInstance);
      var actualTree = devtool.getTree(
        rootInstance._renderedComponent._debugID,
        includeOwner
      );
      expect(actualTree).toEqual(expectedTree);
    });

    ReactDOM.unmountComponentAtNode(node);
    expect(devtool.getRegisteredDebugIDs()).toEqual([]);
  }

  describe('mount', () => {
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
      var tree = {
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
      assertTreeMatches([element, tree]);
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
      var tree = {
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
      assertTreeMatches([element, tree]);
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
      var tree = {
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
      assertTreeMatches([element, tree]);
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
      var tree = {
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
      assertTreeMatches([element, tree]);
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
      var tree = {
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
            }],
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Wow.',
          }],
        }, {
          isComposite: false,
          displayName: 'hr',
          children: [],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a simple tree with composites correctly', () => {
      class Foo extends React.Component {
        render() {
          return <div />;
        }
      }

      var element = <Foo />;
      var tree = {
        isComposite: true,
        displayName: 'Foo',
        children: [{
          isComposite: false,
          displayName: 'div',
          children: [],
        }],
      };
      assertTreeMatches([element, tree]);
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
      var tree = {
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
                }],
              }, {
                isComposite: false,
                displayName: '#text',
                text: 'Mom',
              }],
            }],
          }, {
            isComposite: false,
            displayName: 'a',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Click me.',
            }],
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('ignores null children', () => {
      class Foo extends React.Component {
        render() {
          return null;
        }
      }
      var element = <Foo />;
      var tree = {
        isComposite: true,
        displayName: 'Foo',
        children: [],
      };
      assertTreeMatches([element, tree]);
    });

    it('ignores false children', () => {
      class Foo extends React.Component {
        render() {
          return false;
        }
      }
      var element = <Foo />;
      var tree = {
        isComposite: true,
        displayName: 'Foo',
        children: [],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports text nodes as children', () => {
      var element = <div>{'1'}{2}</div>;
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: false,
          displayName: '#text',
          text: '1',
        }, {
          isComposite: false,
          displayName: '#text',
          text: '2',
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a single text node as a child', () => {
      var element = <div>{'1'}</div>;
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: false,
          displayName: '#text',
          text: '1',
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a single number node as a child', () => {
      var element = <div>{42}</div>;
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: false,
          displayName: '#text',
          text: '42',
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a zero as a child', () => {
      var element = <div>{0}</div>;
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: false,
          displayName: '#text',
          text: '0',
        }],
      };
      assertTreeMatches([element, tree]);
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
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [{
          isComposite: false,
          displayName: '#text',
          text: 'hi',
        }, {
          isComposite: false,
          displayName: '#text',
          text: '42',
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
      assertTreeMatches([element, tree]);
    });

    it('reports html content as no children', () => {
      var element = <div dangerouslySetInnerHTML={{__html: 'Bye.'}} />;
      var tree = {
        isComposite: false,
        displayName: 'div',
        children: [],
      };
      assertTreeMatches([element, tree]);
    });
  });

  describe('update', () => {
    describe('native component', () => {
      it('updates text of a single text child', () => {
        var elementBefore = <div>Hi.</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        var elementAfter = <div>Bye.</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to a single text child', () => {
        var elementBefore = <div />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div>Hi.</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a single text child to no children', () => {
        var elementBefore = <div>Hi.</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        var elementAfter = <div />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from html content to a single text child', () => {
        var elementBefore = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div>Hi.</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a single text child to html content', () => {
        var elementBefore = <div>Hi.</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        var elementAfter = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to multiple text children', () => {
        var elementBefore = <div />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div>{'Hi.'}{'Bye.'}</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from multiple text children to no children', () => {
        var elementBefore = <div>{'Hi.'}{'Bye.'}</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        var elementAfter = <div />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from html content to multiple text children', () => {
        var elementBefore = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div>{'Hi.'}{'Bye.'}</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from multiple text children to html content', () => {
        var elementBefore = <div>{'Hi.'}{'Bye.'}</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        var elementAfter = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from html content to no children', () => {
        var elementBefore = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to html content', () => {
        var elementBefore = <div />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div dangerouslySetInnerHTML={{__html: 'Hi.'}} />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from one text child to multiple text children', () => {
        var elementBefore = <div>Hi.</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };

        var elementAfter = <div>{'Hi.'}{'Bye.'}</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from multiple text children to one text child', () => {
        var elementBefore = <div>{'Hi.'}{'Bye.'}</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        var elementAfter = <div>Hi.</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };
        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates text nodes when reordering', () => {
        var elementBefore = <div>{'Hi.'}{'Bye.'}</div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }],
        };

        var elementAfter = <div>{'Bye.'}{'Hi.'}</div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'Bye.',
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'Hi.',
          }],
        };
        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates native nodes when reordering with keys', () => {
        var elementBefore = (
          <div>
            <div key="a">Hi.</div>
            <div key="b">Bye.</div>
          </div>
        );
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Hi.',
            }],
          }, {
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        var elementAfter = (
          <div>
            <div key="b">Bye.</div>
            <div key="a">Hi.</div>
          </div>
        );
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Bye.',
            }],
          }, {
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Hi.',
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates native nodes when reordering without keys', () => {
        var elementBefore = (
          <div>
            <div>Hi.</div>
            <div>Bye.</div>
          </div>
        );
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Hi.',
            }],
          }, {
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        var elementAfter = (
          <div>
            <div>Bye.</div>
            <div>Hi.</div>
          </div>
        );
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Bye.',
            }],
          }, {
            isComposite: false,
            displayName: 'div',
            children: [{
              isComposite: false,
              displayName: '#text',
              text: 'Hi.',
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates a single composite child of a different type', () => {
        function Foo() {
          return null;
        }

        function Bar() {
          return null;
        }

        var elementBefore = <div><Foo /></div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [],
          }],
        };

        var elementAfter = <div><Bar /></div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates a single composite child of the same type', () => {
        function Foo({ children }) {
          return children;
        }

        var elementBefore = <div><Foo><div /></Foo></div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [{
              isComposite: false,
              displayName: 'div',
              children: [],
            }],
          }],
        };

        var elementAfter = <div><Foo><span /></Foo></div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [{
              isComposite: false,
              displayName: 'span',
              children: [],
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to a single composite child', () => {
        function Foo() {
          return null;
        }

        var elementBefore = <div />;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        var elementAfter = <div><Foo /></div>;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a single composite child to no children', () => {
        function Foo() {
          return null;
        }

        var elementBefore = <div><Foo /></div>;
        var treeBefore = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [],
          }],
        };

        var elementAfter = <div />;
        var treeAfter = {
          isComposite: false,
          displayName: 'div',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates mixed children', () => {
        function Foo() {
          return <div />;
        }
        var element1 = (
          <div>
            {'hi'}
            {false}
            {42}
            {null}
            <Foo />
          </div>
        );
        var tree1 = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: false,
            displayName: '#text',
            text: 'hi',
          }, {
            isComposite: false,
            displayName: '#text',
            text: '42',
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

        var element2 = (
          <div>
            <Foo />
            {false}
            {'hi'}
            {null}
          </div>
        );
        var tree2 = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [{
              isComposite: false,
              displayName: 'div',
              children: [],
            }],
          }, {
            isComposite: false,
            displayName: '#text',
            text: 'hi',
          }],
        };

        var element3 = (
          <div>
            <Foo />
          </div>
        );
        var tree3 = {
          isComposite: false,
          displayName: 'div',
          children: [{
            isComposite: true,
            displayName: 'Foo',
            children: [{
              isComposite: false,
              displayName: 'div',
              children: [],
            }],
          }],
        };

        assertTreeMatches([
          [element1, tree1],
          [element2, tree2],
          [element3, tree3],
        ]);
      });
    });

    describe('functional component', () => {
      it('updates with a native child', () => {
        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo><span /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'span',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from null to a native child', () => {
        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo>{null}</Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><div /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a native child to null', () => {
        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a native child to a composite child', () => {
        function Bar() {
          return null;
        }

        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a composite child to a native child', () => {
        function Bar() {
          return null;
        }

        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo><Bar /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo><div /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from null to a composite child', () => {
        function Bar() {
          return null;
        }

        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo>{null}</Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a composite child to null', () => {
        function Bar() {
          return null;
        }

        function Foo({ children }) {
          return children;
        }

        var elementBefore = <Foo><Bar /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });
    });

    describe('class component', () => {
      it('updates with a native child', () => {
        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo><span /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'span',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from null to a native child', () => {
        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo>{null}</Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><div /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a native child to null', () => {
        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a native child to a composite child', () => {
        var Bar = React.createClass({
          render() {
            return null;
          },
        });

        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo><div /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a composite child to a native child', () => {
        var Bar = React.createClass({
          render() {
            return null;
          },
        });

        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo><Bar /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo><div /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: false,
            displayName: 'div',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from null to a composite child', () => {
        var Bar = React.createClass({
          render() {
            return null;
          },
        });

        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo>{null}</Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from a composite child to null', () => {
        var Bar = React.createClass({
          render() {
            return null;
          },
        });

        var Foo = React.createClass({
          render() {
            return this.props.children;
          },
        });

        var elementBefore = <Foo><Bar /></Foo>;
        var treeBefore = {
          isComposite: true,
          displayName: 'Foo',
          children: [{
            isComposite: true,
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
          isComposite: true,
          displayName: 'Foo',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });
    });
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
    var tree = {
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
              }],
            }, {
              isComposite: false,
              displayName: '#text',
              text: ' Mom',
            }],
          }],
        }],
      }],
    };
    assertTreeMatches([element, tree], true);
  });
});
