// @flow

const { printOwnersList } = require('./storeSerializer');

describe('Store owners list', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let store;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
  });

  it('should drill through intermediate components', () => {
    const Root = () => (
      <Intermediate>
        <Leaf key="children" />
      </Intermediate>
    );
    const Wrapper = ({ children }) => children;
    const Leaf = () => <div>Leaf</div>;
    const Intermediate = ({ children }) => <Wrapper>{children}</Wrapper>;

    act(() => ReactDOM.render(<Root />, document.createElement('div')));
    expect(store).toMatchSnapshot('1: mount');

    const rootID = store.getElementIDAtIndex(0);
    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('2: components owned by <Root>');

    const intermediateID = store.getElementIDAtIndex(1);
    expect(
      printOwnersList(store.getOwnersListForElement(intermediateID))
    ).toMatchSnapshot('3: components owned by <Intermediate>');
  });
});
