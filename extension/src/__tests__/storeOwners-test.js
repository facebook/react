// @flow

const { printOwnersList } = require('./storeSerializer');

describe('Store owners list', () => {
  let React;
  let ReactDOM;
  let act;
  let store;

  beforeEach(() => {
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    act = require('./utils').act;
  });

  it('should drill through intermediate components', () => {
    const Root = () => (
      <Intermediate>
        <div>
          <Leaf />
        </div>
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

  it('should drill through interleaved intermediate components', () => {
    const Root = () => [
      <Intermediate key="intermediate">
        <Leaf />
      </Intermediate>,
      <Leaf key="leaf" />,
    ];
    const Wrapper = ({ children }) => children;
    const Leaf = () => <div>Leaf</div>;
    const Intermediate = ({ children }) => [
      <Leaf key="leaf" />,
      <Wrapper key="wrapper">{children}</Wrapper>,
    ];

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

  it('should show the proper owners list order and contents after insertions and deletions', () => {
    const Root = ({ includeDirect, includeIndirect }) => (
      <div>
        {includeDirect ? <Leaf /> : null}
        {includeIndirect ? (
          <Intermediate>
            <Leaf />
          </Intermediate>
        ) : null}
      </div>
    );
    const Wrapper = ({ children }) => children;
    const Leaf = () => <div>Leaf</div>;
    const Intermediate = ({ children }) => <Wrapper>{children}</Wrapper>;

    const container = document.createElement('div');

    act(() =>
      ReactDOM.render(
        <Root includeDirect={false} includeIndirect={true} />,
        container
      )
    );
    expect(store).toMatchSnapshot('1: mount');

    const rootID = store.getElementIDAtIndex(0);
    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('2: components owned by <Root>');

    act(() =>
      ReactDOM.render(
        <Root includeDirect={true} includeIndirect={true} />,
        container
      )
    );
    expect(store).toMatchSnapshot('3: update to add direct');

    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('4: components owned by <Root>');

    act(() =>
      ReactDOM.render(
        <Root includeDirect={true} includeIndirect={false} />,
        container
      )
    );
    expect(store).toMatchSnapshot('5: update to remove indirect');

    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('6: components owned by <Root>');

    act(() =>
      ReactDOM.render(
        <Root includeDirect={false} includeIndirect={false} />,
        container
      )
    );
    expect(store).toMatchSnapshot('7: update to remove both');

    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('8: components owned by <Root>');
  });

  it('should show the proper owners list ordering after reordered children', () => {
    const Root = ({ ascending }) =>
      ascending
        ? [<Leaf key="A" />, <Leaf key="B" />, <Leaf key="C" />]
        : [<Leaf key="C" />, <Leaf key="B" />, <Leaf key="A" />];
    const Leaf = () => <div>Leaf</div>;

    const container = document.createElement('div');
    act(() => ReactDOM.render(<Root ascending={true} />, container));
    expect(store).toMatchSnapshot('1: mount (ascending)');

    const rootID = store.getElementIDAtIndex(0);
    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('2: components owned by <Root>');

    act(() => ReactDOM.render(<Root ascending={false} />, container));
    expect(store).toMatchSnapshot('3: update (descending)');

    expect(
      printOwnersList(store.getOwnersListForElement(rootID))
    ).toMatchSnapshot('4: components owned by <Root>');
  });
});
