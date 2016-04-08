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

describe('ReactIntrospection', () => {
  var React;
  var ReactIntrospection;
  var ReactDOMComponentTree;
  var ReactInstanceMap;
  var ReactTestUtils;

  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('React');
    ReactIntrospection = require('ReactIntrospection');
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactInstanceMap = require('ReactInstanceMap');
    ReactTestUtils = require('ReactTestUtils');
  });

  // Returns the children rendered by a native internal instance to an array.
  // We use it to find internal instances that have no corresponding public
  // instances, e.g. text nodes or functional components.
  function getChildrenRenderedByNative(nativeInstance) {
    var result = [];
    var children = nativeInstance._renderedChildren;
    for (var key in children) {
      if (children.hasOwnProperty(key)) {
        result.push(children[key]);
      }
    }
    return result;
  }

  // Extracts the single child rendered by a composite component.
  function getChildRenderedByComposite(compositeInstance) {
    return compositeInstance._renderedComponent;
  }

  // Wraps a callback ref so that it receives the corresponding internal
  // instance rather than a DOM node or a public instance.
  function extractInstance(cb) {
    return (ref) => {
      if (!ref) {
        return;
      } else if (ref instanceof Node) {
        cb(ReactDOMComponentTree.getInstanceFromNode(ref));
      } else if (ref.render) {
        cb(ReactInstanceMap.get(ref));
      }
    };
  }

  describe('missing value', () => {
    describe('isComposite()', () => {
      it('returns false', () => {
        expect(ReactIntrospection.isComposite(null)).toBe(false);
      });
    });

    describe('getDisplayName()', () => {
      it('returns Unknown', () => {
        expect(ReactIntrospection.getDisplayName(null)).toBe('Unknown');
      });
    });

    describe('getChildren()', () => {
      it('returns no children', () => {
        expect(ReactIntrospection.getChildren(null)).toEqual([]);
      });
    });
  });

  describe('invalid component', () => {
    describe('isComposite()', () => {
      it('throws', () => {
        expect(() => ReactIntrospection.isComposite({})).toThrow(
          'ReactIntrospection: Argument is not an internal instance.'
        );
      });
    });

    describe('getDisplayName()', () => {
      it('throws', () => {
        expect(() => ReactIntrospection.getDisplayName({})).toThrow(
          'ReactIntrospection: Argument is not an internal instance.'
        );
      });
    });

    describe('getChildren()', () => {
      it('throws', () => {
        expect(() => ReactIntrospection.getChildren({})).toThrow(
          'ReactIntrospection: Argument is not an internal instance.'
        );
      });
    });
  });

  describe('empty component', () => {
    var emptyInst;

    beforeEach(() => {
      class ComponentThatReturnsNull extends React.Component {
        render() {
          return null;
        }
      }
      ReactTestUtils.renderIntoDocument(
        <ComponentThatReturnsNull ref={extractInstance(inst => {
          emptyInst = getChildRenderedByComposite(inst);
        })} />
      );
    });

    describe('isComposite()', () => {
      it('returns false', () => {
        expect(ReactIntrospection.isComposite(emptyInst)).toBe(false);
      });
    });

    describe('getDisplayName()', () => {
      it('returns #empty', () => {
        expect(ReactIntrospection.getDisplayName(emptyInst)).toBe('#empty');
      });
    });

    describe('getChildren()', () => {
      it('returns no children', () => {
        expect(ReactIntrospection.getChildren(emptyInst)).toEqual([]);
      });
    });
  });

  describe('text component', () => {
    var stringInst;
    var numberInst;

    beforeEach(() => {
      ReactTestUtils.renderIntoDocument(
        <div ref={extractInstance(inst => {
          var children = getChildrenRenderedByNative(inst);
          stringInst = children[0];
          numberInst = children[1];
        })}>
          {'1'}{2}
        </div>
      );
    });

    describe('isComposite()', () => {
      it('returns false', () => {
        expect(ReactIntrospection.isComposite(stringInst)).toBe(false);
        expect(ReactIntrospection.isComposite(numberInst)).toBe(false);
      });
    });

    describe('getDisplayName()', () => {
      it('returns #text', () => {
        expect(ReactIntrospection.getDisplayName(stringInst)).toBe('#text');
        expect(ReactIntrospection.getDisplayName(numberInst)).toBe('#text');
      });
    });

    describe('getChildren()', () => {
      it('returns no children', () => {
        expect(ReactIntrospection.getChildren(stringInst)).toEqual([]);
        expect(ReactIntrospection.getChildren(numberInst)).toEqual([]);
      });
    });
  });

  describe('native component', () => {
    describe('isComposite()', () => {
      it('returns false', () => {
        var divInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => divInst = inst)} />
        );
        expect(ReactIntrospection.isComposite(divInst)).toBe(false);
      });
    });

    describe('getDisplayName()', () => {
      it('returns its type', () => {
        var divInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => divInst = inst)} />
        );
        expect(ReactIntrospection.getDisplayName(divInst)).toBe('div');
      });
    });

    describe('getChildren()', () => {
      it('returns no children for empty div', () => {
        var divInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => divInst = inst)} />
        );
        expect(ReactIntrospection.getChildren(divInst)).toEqual([]);
      });

      it('returns no children for div with inlined text content', () => {
        var divInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => divInst = inst)}>
            Hi.
          </div>
        );
        expect(ReactIntrospection.getChildren(divInst)).toEqual([]);
      });

      it('returns two children for div with two text children', () => {
        var divInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => divInst = inst)}>
            42{'10'}
          </div>
        );

        var children = ReactIntrospection.getChildren(divInst);
        expect(children.length).toBe(2);
        expect(ReactIntrospection.getDisplayName(children[0])).toBe('#text');
        expect(ReactIntrospection.getDisplayName(children[1])).toBe('#text');
      });

      it('returns single child for div with a single native child', () => {
        var parentDivInst;
        var childSpanInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => parentDivInst = inst)}>
            <span ref={extractInstance(inst => childSpanInst = inst)} />
          </div>
        );

        var children = ReactIntrospection.getChildren(parentDivInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(childSpanInst);
      });

      it('returns single child for div with a single composite child', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }

        var parentDivInst;
        var chidlFooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => parentDivInst = inst)}>
            <Foo ref={extractInstance(inst => chidlFooInst = inst)} />
          </div>
        );

        var children = ReactIntrospection.getChildren(parentDivInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(chidlFooInst);
      });

      it('returns all children for div with mixed children', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }

        var parentDivInst;
        var childSpanInst;
        var chidlFooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => parentDivInst = inst)}>
            {'hi'}
            {false}
            {42}
            <span ref={extractInstance(inst => childSpanInst = inst)} />
            {null}
            <Foo ref={extractInstance(inst => chidlFooInst = inst)} />
          </div>
        );

        var children = ReactIntrospection.getChildren(parentDivInst);
        expect(children.length).toBe(4);
        expect(ReactIntrospection.getDisplayName(children[0])).toBe('#text');
        expect(ReactIntrospection.getDisplayName(children[1])).toBe('#text');
        expect(children[2]).toBe(childSpanInst);
        expect(children[3]).toBe(chidlFooInst);
      });
    });
  });

  describe('classic component', () => {
    describe('isComposite()', () => {
      it('returns true', () => {
        var Foo = React.createClass({
          render() {
            return null;
          },
        });

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.isComposite(fooInst)).toBe(true);
      });
    });

    describe('getDisplayName()', () => {
      it('prefers displayName', () => {
        var Foo = React.createClass({
          render() {
            return null;
          },
        });

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Foo');
      });

      it('falls back to Unknown without displayName', () => {
        var Foo = React.createClass({
          render() {
            return null;
          },
        });
        delete Foo.displayName;

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Unknown');
      });
    });

    describe('getChildren()', () => {
      it('returns no children for composite returning null', () => {
        var Foo = React.createClass({
          render() {
            return null;
          },
        });

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        expect(ReactIntrospection.getChildren(fooInst)).toEqual([]);
      });

      it('returns single child for composite returning native', () => {
        var childSpanInst;
        var Foo = React.createClass({
          render() {
            return (
              <span ref={extractInstance(inst => childSpanInst = inst)} />
            );
          },
        });

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(childSpanInst);
      });

      it('returns single child for composite returning composite', () => {
        var Bar = React.createClass({
          render() {
            return <span />;
          },
        });
        var barInst;
        var Foo = React.createClass({
          render() {
            return (
              <Bar ref={extractInstance(inst => barInst = inst)} />
            );
          },
        });

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(barInst);
      });
    });
  });

  describe('modern component', () => {
    describe('isComposite()', () => {
      it('returns true', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.isComposite(fooInst)).toBe(true);
      });
    });

    describe('getDisplayName()', () => {
      it('normally uses name', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Foo');
      });

      it('prefers displayName if specified', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }
        Foo.displayName = 'Bar';

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Bar');
      });

      it('falls back to ReactComponent', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }
        delete Foo.name;

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        // Ideally this should return Unknown for consistency.
        // For now, this test documents the existing behavior.
        expect(
          ReactIntrospection.getDisplayName(fooInst)
        ).toBe('ReactComponent');
      });
    });

    describe('getChildren()', () => {
      it('returns no children for composite returning null', () => {
        class Foo extends React.Component {
          render() {
            return null;
          }
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        expect(ReactIntrospection.getChildren(fooInst)).toEqual([]);
      });

      it('returns single child for composite returning native', () => {
        var childSpanInst;
        class Foo extends React.Component {
          render() {
            return (
              <span ref={extractInstance(inst => childSpanInst = inst)} />
            );
          }
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(childSpanInst);
      });

      it('returns single child for composite returning composite', () => {
        class Bar extends React.Component {
          render() {
            return null;
          }
        }
        var barInst;
        class Foo extends React.Component {
          render() {
            return (
              <Bar ref={extractInstance(inst => barInst = inst)} />
            );
          }
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(barInst);
      });
    });
  });

  describe('factory component', () => {
    describe('isComposite()', () => {
      it('returns true', () => {
        function Foo() {
          return {
            render() {
              return null;
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.isComposite(fooInst)).toBe(true);
      });
    });

    describe('getDisplayName()', () => {
      it('normally returns name', () => {
        function Foo() {
          return {
            render() {
              return null;
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Foo');
      });

      it('prefers displayName if specified', () => {
        function Foo() {
          return {
            render() {
              return null;
            },
          };
        }
        Foo.displayName = 'Bar';

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Bar');
      });

      it('falls back to Object', () => {
        function Foo() {
          return {
            render() {
              return null;
            },
          };
        }
        delete Foo.name;

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)} />
        );

        // Ideally this should return Unknown for consistency.
        // For now, this test documents the existing behavior.
        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Object');
      });
    });

    describe('getChildren()', () => {
      it('returns no children for composite returning null', () => {
        function Foo() {
          return {
            render() {
              return null;
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        expect(ReactIntrospection.getChildren(fooInst)).toEqual([]);
      });

      it('returns single child for composite returning native', () => {
        var childSpanInst;

        function Foo() {
          return {
            render() {
              return (
                <span ref={extractInstance(inst => childSpanInst = inst)} />
              );
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(childSpanInst);
      });

      it('returns single child for composite returning composite', () => {
        function Bar() {
          return {
            render() {
              return null;
            },
          };
        }
        var barInst;
        function Foo() {
          return {
            render() {
              return (
                <Bar ref={extractInstance(inst => barInst = inst)} />
              );
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <Foo ref={extractInstance(inst => fooInst = inst)}>
            (it ignores props.children)
          </Foo>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(barInst);
      });
    });
  });

  describe('functional component', () => {
    describe('isComposite()', () => {
      it('returns true', () => {
        function Foo() {
          return null;
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo />
          </div>
        );

        expect(ReactIntrospection.isComposite(fooInst)).toBe(true);
      });
    });

    describe('getDisplayName()', () => {
      it('normally returns name', () => {
        function Foo() {
          return null;
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo />
          </div>
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Foo');
      });

      it('prefers displayName if specified', () => {
        function Foo() {
          return null;
        }
        Foo.displayName = 'Bar';

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo />
          </div>
        );

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Bar');
      });

      it('falls back to StatelessComponent', () => {
        function Foo() {
          return null;
        }
        delete Foo.name;

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo />
          </div>
        );

        // Ideally this should return Unknown instead.
        // For now, this test documents the existing behavior.
        expect(
          ReactIntrospection.getDisplayName(fooInst)
        ).toBe('StatelessComponent');
      });
    });

    describe('getChildren()', () => {
      it('returns no children for composite returning null', () => {
        function Foo() {
          return null;
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo>
              (it ignores props.children)
            </Foo>
          </div>
        );

        expect(ReactIntrospection.getChildren(fooInst)).toEqual([]);
      });

      it('returns single child for composite returning native', () => {
        var childSpanInst;

        function Foo() {
          return (
            <span
              ref={extractInstance(inst => childSpanInst = inst)}
            />
          );
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo>
              (it ignores props.children)
            </Foo>
          </div>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(childSpanInst);
      });

      it('returns single child for composite returning composite', () => {
        class Bar extends React.Component {
          render() {
            return null;
          }
        }
        var barInst;
        function Foo() {
          return {
            render() {
              return (
                <Bar ref={extractInstance(inst => barInst = inst)} />
              );
            },
          };
        }

        var fooInst;
        ReactTestUtils.renderIntoDocument(
          <div ref={extractInstance(inst => {
            fooInst = getChildrenRenderedByNative(inst)[0];
          })}>
            <Foo ref={extractInstance(inst => fooInst = inst)}>
              (it ignores props.children)
            </Foo>
          </div>
        );

        var children = ReactIntrospection.getChildren(fooInst);
        expect(children.length).toBe(1);
        expect(children[0]).toBe(barInst);
      });
    });
  });

  describe('custom internal component', () => {
    describe('isComposite()', () => {
      it('returns true if the element type is a function', () => {
        function Foo() {
          return null;
        }

        var fooInst = {
          _currentElement: React.createElement(Foo),
          mountComponent() {},
        };

        expect(ReactIntrospection.isComposite(fooInst)).toBe(true);
      });

      it('returns false if the element type is a string', () => {
        var fooInst = {
          _currentElement: React.createElement('foo'),
          mountComponent() {},
        };

        expect(ReactIntrospection.isComposite(fooInst)).toBe(false);
      });
    });

    describe('getDisplayName()', () => {
      it('delegates to getName() if defined', () => {
        var fooInst = {
          _currentElement: React.createElement('foo'),
          getName() {
            return 'Bar';
          },
          mountComponent() {},
        };
        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Bar');
      });

      it('returns type string if there is no getName()', () => {
        var fooInst = {
          _currentElement: React.createElement('foo'),
          mountComponent() {},
        };
        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('foo');
      });

      it('returns type function name if there is no getName()', () => {
        function Foo() {
          return null;
        }
        var fooInst = {
          _currentElement: React.createElement(Foo),
          mountComponent() {},
        };
        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Foo');
      });

      it('falls back to Unknown', () => {
        function Foo() {
          return null;
        }
        delete Foo.name;

        var fooInst = {
          _currentElement: React.createElement(Foo),
          mountComponent() {},
        };

        expect(ReactIntrospection.getDisplayName(fooInst)).toBe('Unknown');
      });
    });
  });
});
