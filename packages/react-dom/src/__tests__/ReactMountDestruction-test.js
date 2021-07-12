/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

describe('ReactMount', () => {
  it('should destroy a react root upon request', () => {
    const mainContainerDiv = document.createElement('div');
    document.body.appendChild(mainContainerDiv);

    const instanceOne = <div className="firstReactDiv" />;
    const firstRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(firstRootDiv);
    ReactDOM.render(instanceOne, firstRootDiv);

    const instanceTwo = <div className="secondReactDiv" />;
    const secondRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(secondRootDiv);
    ReactDOM.render(instanceTwo, secondRootDiv);

    // Test that two react roots are rendered in isolation
    expect(firstRootDiv.firstChild.className).toBe('firstReactDiv');
    expect(secondRootDiv.firstChild.className).toBe('secondReactDiv');

    // Test that after unmounting each, they are no longer in the document.
    ReactDOM.unmountComponentAtNode(firstRootDiv);
    expect(firstRootDiv.firstChild).toBeNull();
    ReactDOM.unmountComponentAtNode(secondRootDiv);
    expect(secondRootDiv.firstChild).toBeNull();
  });

  describe('when unmounting the container node', () => {
    it('should remove references from rendered DOM elements to their fiber nodes', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <span>Hello World</span>
        </div>,
        container,
      );
      const node = container.firstChild;
      expect(getInstanceFromNode(node)).not.toBeNull();
      const nestedNode = node.firstChild;
      expect(getInstanceFromNode(nestedNode)).not.toBeNull();

      ReactDOM.unmountComponentAtNode(container);
      expect(getInstanceFromNode(node)).toBeNull();
      expect(getInstanceFromNode(nestedNode)).toBeNull();
    });
    it("should remove references from rendered DOM elements to their fiber's props", () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div className="hello">
          <span className="world" />
        </div>,
        container,
      );
      const node = container.firstChild;
      expect(getFiberCurrentPropsFromNode(node)).not.toBeNull();
      const nestedNode = node.firstChild;
      expect(getFiberCurrentPropsFromNode(nestedNode)).not.toBeNull();

      ReactDOM.unmountComponentAtNode(container);
      expect(getFiberCurrentPropsFromNode(node)).toBeNull();
      expect(getFiberCurrentPropsFromNode(nestedNode)).toBeNull();
    });
  });
  describe('when unmounting a non-container node', () => {
    it('should remove references from rendered DOM elements to their fiber nodes', () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <span>
            <i>Hello World</i>
          </span>
        </div>,
        container,
      );
      const node = container.firstChild.firstChild;
      expect(getInstanceFromNode(node)).not.toBeNull();
      const nestedNode = node.firstChild;
      expect(getInstanceFromNode(nestedNode)).not.toBeNull();

      ReactDOM.render(<div />, container);
      expect(getInstanceFromNode(node)).toBeNull();
      expect(getInstanceFromNode(nestedNode)).toBeNull();
    });
    it("should remove references from rendered DOM elements to their fiber's props", () => {
      const container = document.createElement('div');
      ReactDOM.render(
        <div>
          <span className="hello">
            <i className="world" />
          </span>
        </div>,
        container,
      );
      const node = container.firstChild.firstChild;
      expect(getFiberCurrentPropsFromNode(node)).not.toBeNull();
      const nestedNode = node.firstChild;
      expect(getFiberCurrentPropsFromNode(nestedNode)).not.toBeNull();

      ReactDOM.render(<div />, container);
      expect(getFiberCurrentPropsFromNode(node)).toBeNull();
      expect(getFiberCurrentPropsFromNode(nestedNode)).toBeNull();
    });
  });

  it('should warn when unmounting a non-container root node', () => {
    const mainContainerDiv = document.createElement('div');

    const component = (
      <div>
        <div />
      </div>
    );
    ReactDOM.render(component, mainContainerDiv);

    // Test that unmounting at a root node gives a helpful warning
    const rootDiv = mainContainerDiv.firstChild;
    expect(() =>
      ReactDOM.unmountComponentAtNode(rootDiv),
    ).toErrorDev(
      "Warning: unmountComponentAtNode(): The node you're attempting to " +
        'unmount was rendered by React and is not a top-level container. You ' +
        'may have accidentally passed in a React root node instead of its ' +
        'container.',
      {withoutStack: true},
    );
  });

  it('should warn when unmounting a non-container, non-root node', () => {
    const mainContainerDiv = document.createElement('div');

    const component = (
      <div>
        <div>
          <div />
        </div>
      </div>
    );
    ReactDOM.render(component, mainContainerDiv);

    // Test that unmounting at a non-root node gives a different warning
    const nonRootDiv = mainContainerDiv.firstChild.firstChild;
    expect(() =>
      ReactDOM.unmountComponentAtNode(nonRootDiv),
    ).toErrorDev(
      "Warning: unmountComponentAtNode(): The node you're attempting to " +
        'unmount was rendered by React and is not a top-level container. ' +
        'Instead, have the parent component update its state and rerender in ' +
        'order to remove this component.',
      {withoutStack: true},
    );
  });
});

function getInstanceFromNode(node) {
  // the prefix must be the same as in the internalInstanceKey in ReactDOMComponentTree
  return getPrefixedValueFromNode(node, '__reactFiber$');
}

function getFiberCurrentPropsFromNode(node) {
  // the prefix must be the same as in the internalPropsKey in ReactDOMComponentTree
  return getPrefixedValueFromNode(node, '__reactProps$');
}

function getPrefixedValueFromNode(node, prefix) {
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.startsWith(prefix)) {
      return node[key];
    }
  }
  throw new Error(
    'node ' + node + ' has no property prefixed "' + prefix + '".',
  );
}
