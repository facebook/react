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

describe('ReactComponentTreeDevtool', () => {
  var React;
  var ReactNative;
  var ReactInstanceMap;
  var ReactComponentTreeDevtool;
  var createReactNativeComponentClass;
  var View;
  var Image;
  var Text;

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactNative = require('ReactNative');
    ReactInstanceMap = require('ReactInstanceMap');
    ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');
    View = require('View');
    createReactNativeComponentClass = require('createReactNativeComponentClass');
    Image = createReactNativeComponentClass({
      validAttributes: {},
      uiViewClassName: 'Image',
    });
    var RCText = createReactNativeComponentClass({
      validAttributes: {},
      uiViewClassName: 'RCText',
    });
    Text = React.createClass({
      childContextTypes: {
        isInAParentText: React.PropTypes.bool,
      },
      getChildContext() {
        return {isInAParentText: true};
      },
      render() {
        return <RCText {...this.props} />;
      },
    });
  });

  function getRootDisplayNames() {
    return ReactComponentTreeDevtool.getRootIDs()
      .map(ReactComponentTreeDevtool.getDisplayName);
  }

  function getRegisteredDisplayNames() {
    return ReactComponentTreeDevtool.getRegisteredIDs()
      .map(ReactComponentTreeDevtool.getDisplayName);
  }

  function getTree(rootID, options = {}) {
    var {
      includeOwnerDisplayName = false,
      includeParentDisplayName = false,
      expectedParentID = null,
    } = options;

    var result = {
      displayName: ReactComponentTreeDevtool.getDisplayName(rootID),
    };

    var ownerID = ReactComponentTreeDevtool.getOwnerID(rootID);
    var parentID = ReactComponentTreeDevtool.getParentID(rootID);
    expect(parentID).toBe(expectedParentID);

    if (includeParentDisplayName && parentID) {
      result.parentDisplayName = ReactComponentTreeDevtool.getDisplayName(parentID);
    }
    if (includeOwnerDisplayName && ownerID) {
      result.ownerDisplayName = ReactComponentTreeDevtool.getDisplayName(ownerID);
    }

    var childIDs = ReactComponentTreeDevtool.getChildIDs(rootID);
    var text = ReactComponentTreeDevtool.getText(rootID);
    if (text != null) {
      result.text = text;
    } else {
      result.children = childIDs.map(childID =>
        getTree(childID, {...options, expectedParentID: rootID })
      );
    }

    return result;
  }

  function assertTreeMatches(pairs, options) {
    if (!Array.isArray(pairs[0])) {
      pairs = [pairs];
    }

    var currentElement;
    var rootInstance;

    class Wrapper extends React.Component {
      render() {
        rootInstance = ReactInstanceMap.get(this);
        return currentElement;
      }
    }

    function getActualTree() {
      return getTree(rootInstance._debugID, options).children[0];
    }

    // Mount once, render updates, then unmount.
    // Ensure the tree is correct on every step.
    pairs.forEach(([element, expectedTree]) => {
      currentElement = element;
      ReactNative.render(<Wrapper />, 1);
      expect(getActualTree()).toEqual(expectedTree);
      ReactComponentTreeDevtool.purgeUnmountedComponents();
      expect(getActualTree()).toEqual(expectedTree);
    });
    ReactNative.unmountComponentAtNode(1);
    ReactComponentTreeDevtool.purgeUnmountedComponents();
    expect(getActualTree()).toBe(undefined);
    expect(getRootDisplayNames()).toEqual([]);
    expect(getRegisteredDisplayNames()).toEqual([]);

    // Mount and unmount for every pair.
    // Ensure the tree is correct on every step.
    pairs.forEach(([element, expectedTree]) => {
      currentElement = element;
      ReactNative.render(<Wrapper />, 1);
      ReactNative.unmountComponentAtNode(1);
      expect(getActualTree()).toEqual(expectedTree);
      ReactComponentTreeDevtool.purgeUnmountedComponents();
      expect(getActualTree()).toBe(undefined);
      expect(getRootDisplayNames()).toEqual([]);
      expect(getRegisteredDisplayNames()).toEqual([]);
    });
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

      var element = <View><Foo /><Baz /><Qux /></View>;
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'Bar',
          children: [],
        }, {
          displayName: 'Baz',
          children: [],
        }, {
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

      var element = <View><Foo /><Baz /><Qux /></View>;
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'Bar',
          children: [],
        }, {
          displayName: 'Baz',
          children: [],
        }, {
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

      var element = <View><Foo /><Baz /><Qux /></View>;
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'Bar',
          children: [],
        }, {
          displayName: 'Baz',
          children: [],
        }, {
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

      var element = <View><Foo /><Baz /><Qux /></View>;
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'Bar',
          children: [],
        }, {
          displayName: 'Baz',
          children: [],
        }, {
          displayName: 'Unknown',
          children: [],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a native tree correctly', () => {
      var element = (
        <View>
          <View>
            <Text>
              Hi!
            </Text>
          </View>
          <Image />
        </View>
      );
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Hi!',
              }],
            }],
          }],
        }, {
          displayName: 'Image',
          children: [],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a simple tree with composites correctly', () => {
      class Foo extends React.Component {
        render() {
          return <Image />;
        }
      }

      var element = <Foo />;
      var tree = {
        displayName: 'Foo',
        children: [{
          displayName: 'Image',
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
        return <View>{children}</View>;
      }
      class Baz extends React.Component {
        render() {
          return (
            <View>
              <Foo />
              <Bar>
                <Text>Hi,</Text>
              </Bar>
              <Image />
            </View>
          );
        }
      }

      var element = <Baz />;
      var tree = {
        displayName: 'Baz',
        children: [{
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [{
              displayName: 'Qux',
              children: [],
            }],
          }, {
            displayName: 'Bar',
            children: [{
              displayName: 'View',
              children: [{
                displayName: 'Text',
                children: [{
                  displayName: 'RCText',
                  children: [{
                    displayName: '#text',
                    text: 'Hi,',
                  }],
                }],
              }],
            }],
          }, {
            displayName: 'Image',
            children: [],
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
        displayName: 'Foo',
        children: [],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports text nodes as children', () => {
      var element = <Text>{'1'}{2}</Text>;
      var tree = {
        displayName: 'Text',
        children: [{
          displayName: 'RCText',
          children: [{
            displayName: '#text',
            text: '1',
          }, {
            displayName: '#text',
            text: '2',
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a single text node as a child', () => {
      var element = <Text>{'1'}</Text>;
      var tree = {
        displayName: 'Text',
        children: [{
          displayName: 'RCText',
          children: [{
            displayName: '#text',
            text: '1',
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a single number node as a child', () => {
      var element = <Text>{42}</Text>;
      var tree = {
        displayName: 'Text',
        children: [{
          displayName: 'RCText',
          children: [{
            displayName: '#text',
            text: '42',
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('reports a zero as a child', () => {
      var element = <Text>{0}</Text>;
      var tree = {
        displayName: 'Text',
        children: [{
          displayName: 'RCText',
          children: [{
            displayName: '#text',
            text: '0',
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });

    it('skips empty nodes for multiple children', () => {
      function Foo() {
        return <Image />;
      }
      var element = (
        <View>
          {false}
          <Foo />
          {null}
          <Foo />
        </View>
      );
      var tree = {
        displayName: 'View',
        children: [{
          displayName: 'Foo',
          children: [{
            displayName: 'Image',
            children: [],
          }],
        }, {
          displayName: 'Foo',
          children: [{
            displayName: 'Image',
            children: [],
          }],
        }],
      };
      assertTreeMatches([element, tree]);
    });
  });

  describe('update', () => {
    describe('native component', () => {
      it('updates text of a single text child', () => {
        var elementBefore = <Text>Hi.</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }],
          }],
        };

        var elementAfter = <Text>Bye.</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to a single text child', () => {
        var elementBefore = <Text />;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [],
          }],
        };

        var elementAfter = <Text>Hi.</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
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

      it('updates from a single text child to no children', () => {
        var elementBefore = <Text>Hi.</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }],
          }],
        };

        var elementAfter = <Text />;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from no children to multiple text children', () => {
        var elementBefore = <Text />;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [],
          }],
        };

        var elementAfter = <Text>{'Hi.'}{'Bye.'}</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }, {
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from multiple text children to no children', () => {
        var elementBefore = <Text>{'Hi.'}{'Bye.'}</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }, {
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        var elementAfter = <Text />;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [],
          }],
        };
        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from one text child to multiple text children', () => {
        var elementBefore = <Text>Hi.</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }],
          }],
        };

        var elementAfter = <Text>{'Hi.'}{'Bye.'}</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }, {
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates from multiple text children to one text child', () => {
        var elementBefore = <Text>{'Hi.'}{'Bye.'}</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }, {
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        var elementAfter = <Text>Hi.</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
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

      it('updates text nodes when reordering', () => {
        var elementBefore = <Text>{'Hi.'}{'Bye.'}</Text>;
        var treeBefore = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Hi.',
            }, {
              displayName: '#text',
              text: 'Bye.',
            }],
          }],
        };

        var elementAfter = <Text>{'Bye.'}{'Hi.'}</Text>;
        var treeAfter = {
          displayName: 'Text',
          children: [{
            displayName: 'RCText',
            children: [{
              displayName: '#text',
              text: 'Bye.',
            }, {
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

      it('updates native nodes when reordering with keys', () => {
        var elementBefore = (
          <View>
            <Text key="a">Hi.</Text>
            <Text key="b">Bye.</Text>
          </View>
        );
        var treeBefore = {
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Hi.',
              }],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Bye.',
              }],
            }],
          }],
        };

        var elementAfter = (
          <View>
            <Text key="b">Bye.</Text>
            <Text key="a">Hi.</Text>
          </View>
        );
        var treeAfter = {
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Bye.',
              }],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Hi.',
              }],
            }],
          }],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates native nodes when reordering with keys', () => {
        var elementBefore = (
          <View>
            <Text>Hi.</Text>
            <Text>Bye.</Text>
          </View>
        );
        var treeBefore = {
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Hi.',
              }],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Bye.',
              }],
            }],
          }],
        };

        var elementAfter = (
          <View>
            <Text>Bye.</Text>
            <Text>Hi.</Text>
          </View>
        );
        var treeAfter = {
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Bye.',
              }],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'Hi.',
              }],
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

        var elementBefore = <View><Foo /></View>;
        var treeBefore = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [],
          }],
        };

        var elementAfter = <View><Bar /></View>;
        var treeAfter = {
          displayName: 'View',
          children: [{
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

        var elementBefore = <View><Foo><View /></Foo></View>;
        var treeBefore = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [{
              displayName: 'View',
              children: [],
            }],
          }],
        };

        var elementAfter = <View><Foo><Image /></Foo></View>;
        var treeAfter = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [{
              displayName: 'Image',
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

        var elementBefore = <View />;
        var treeBefore = {
          displayName: 'View',
          children: [],
        };

        var elementAfter = <View><Foo /></View>;
        var treeAfter = {
          displayName: 'View',
          children: [{
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

        var elementBefore = <View><Foo /></View>;
        var treeBefore = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [],
          }],
        };

        var elementAfter = <View />;
        var treeAfter = {
          displayName: 'View',
          children: [],
        };

        assertTreeMatches([
          [elementBefore, treeBefore],
          [elementAfter, treeAfter],
        ]);
      });

      it('updates mixed children', () => {
        function Foo() {
          return <View />;
        }
        var element1 = (
          <View>
            <Text>hi</Text>
            {false}
            <Text>{42}</Text>
            {null}
            <Foo />
          </View>
        );
        var tree1 = {
          displayName: 'View',
          children: [{
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'hi',
              }],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: '42',
              }],
            }],
          }, {
            displayName: 'Foo',
            children: [{
              displayName: 'View',
              children: [],
            }],
          }],
        };

        var element2 = (
          <View>
            <Foo />
            {false}
            <Text>hi</Text>
            {null}
          </View>
        );
        var tree2 = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [{
              displayName: 'View',
              children: [],
            }],
          }, {
            displayName: 'Text',
            children: [{
              displayName: 'RCText',
              children: [{
                displayName: '#text',
                text: 'hi',
              }],
            }],
          }],
        };

        var element3 = (
          <View>
            <Foo />
          </View>
        );
        var tree3 = {
          displayName: 'View',
          children: [{
            displayName: 'Foo',
            children: [{
              displayName: 'View',
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo><Image /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'Image',
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
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><View /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
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
          displayName: 'Foo',
          children: [{
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo><View /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
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
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
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
          displayName: 'Foo',
          children: [{
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo><Image /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'Image',
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
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><View /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
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

        var elementBefore = <Foo><View /></Foo>;
        var treeBefore = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
            children: [],
          }],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
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
          displayName: 'Foo',
          children: [{
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo><View /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
            displayName: 'View',
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
          displayName: 'Foo',
          children: [],
        };

        var elementAfter = <Foo><Bar /></Foo>;
        var treeAfter = {
          displayName: 'Foo',
          children: [{
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
          displayName: 'Foo',
          children: [{
            displayName: 'Bar',
            children: [],
          }],
        };

        var elementAfter = <Foo>{null}</Foo>;
        var treeAfter = {
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
        return <Bar><Text>Hi.</Text></Bar>;
      }
    }
    function Bar({children}) {
      return <View>{children}<Text>Mom</Text></View>;
    }

    // Note that owner is not calculated for text nodes
    // because they are not created from real elements.
    var element = <View><Foo /></View>;
    var tree = {
      displayName: 'View',
      children: [{
        displayName: 'Foo',
        children: [{
          displayName: 'Bar',
          ownerDisplayName: 'Foo',
          children: [{
            displayName: 'View',
            ownerDisplayName: 'Bar',
            children: [{
              displayName: 'Text',
              ownerDisplayName: 'Foo',
              children: [{
                displayName: 'RCText',
                ownerDisplayName: 'Text',
                children: [{
                  displayName: '#text',
                  text: 'Hi.',
                }],
              }],
            }, {
              displayName: 'Text',
              ownerDisplayName: 'Bar',
              children: [{
                displayName: 'RCText',
                ownerDisplayName: 'Text',
                children: [{
                  displayName: '#text',
                  text: 'Mom',
                }],
              }],
            }],
          }],
        }],
      }],
    };
    assertTreeMatches([element, tree], {includeOwnerDisplayName: true});
  });

  it('preserves unmounted components until purge', () => {
    var renderBar = true;
    var fooInstance;
    var barInstance;

    class Foo extends React.Component {
      render() {
        fooInstance = ReactInstanceMap.get(this);
        return renderBar ? <Bar /> : null;
      }
    }

    class Bar extends React.Component {
      render() {
        barInstance = ReactInstanceMap.get(this);
        return null;
      }
    }

    ReactNative.render(<Foo />, 1);
    expect(
      getTree(barInstance._debugID, {
        includeParentDisplayName: true,
        expectedParentID: fooInstance._debugID,
      })
    ).toEqual({
      displayName: 'Bar',
      parentDisplayName: 'Foo',
      children: [],
    });

    renderBar = false;
    ReactNative.render(<Foo />, 1);
    expect(
      getTree(barInstance._debugID, {
        includeParentDisplayName: true,
        expectedParentID: fooInstance._debugID,
      })
    ).toEqual({
      displayName: 'Bar',
      parentDisplayName: 'Foo',
      children: [],
    });

    ReactNative.unmountComponentAtNode(1);
    expect(
      getTree(barInstance._debugID, {
        includeParentDisplayName: true,
        expectedParentID: fooInstance._debugID,
      })
    ).toEqual({
      displayName: 'Bar',
      parentDisplayName: 'Foo',
      children: [],
    });

    ReactComponentTreeDevtool.purgeUnmountedComponents();
    expect(
      getTree(barInstance._debugID, {includeParentDisplayName: true})
    ).toEqual({
      displayName: 'Unknown',
      children: [],
    });
  });

  it('reports update counts', () => {
    ReactNative.render(<View />, 1);
    var viewID = ReactComponentTreeDevtool.getRootIDs()[0];
    expect(ReactComponentTreeDevtool.getUpdateCount(viewID)).toEqual(0);

    ReactNative.render(<Image />, 1);
    var imageID = ReactComponentTreeDevtool.getRootIDs()[0];
    expect(ReactComponentTreeDevtool.getUpdateCount(viewID)).toEqual(0);
    expect(ReactComponentTreeDevtool.getUpdateCount(imageID)).toEqual(0);

    ReactNative.render(<Image />, 1);
    expect(ReactComponentTreeDevtool.getUpdateCount(viewID)).toEqual(0);
    expect(ReactComponentTreeDevtool.getUpdateCount(imageID)).toEqual(1);

    ReactNative.render(<Image />, 1);
    expect(ReactComponentTreeDevtool.getUpdateCount(viewID)).toEqual(0);
    expect(ReactComponentTreeDevtool.getUpdateCount(imageID)).toEqual(2);

    ReactNative.unmountComponentAtNode(1);
    expect(ReactComponentTreeDevtool.getUpdateCount(viewID)).toEqual(0);
    expect(ReactComponentTreeDevtool.getUpdateCount(imageID)).toEqual(2);
  });

  it('does not report top-level wrapper as a root', () => {
    ReactNative.render(<View><Image /></View>, 1);
    expect(getRootDisplayNames()).toEqual(['View']);

    ReactNative.render(<View><Text /></View>, 1);
    expect(getRootDisplayNames()).toEqual(['View']);

    ReactNative.unmountComponentAtNode(1);
    expect(getRootDisplayNames()).toEqual([]);

    ReactComponentTreeDevtool.purgeUnmountedComponents();
    expect(getRootDisplayNames()).toEqual([]);

    // This currently contains TopLevelWrapper until purge
    // so we only check it at the very end.
    expect(getRegisteredDisplayNames()).toEqual([]);
  });
});
