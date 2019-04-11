// @flow

describe('Store', () => {
  let React;
  let ReactDOM;
  let store;

  beforeEach(() => {
    store = global.store;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should initialize a simple tree', () => {
    const Grandparent = () => (
      <React.Fragment>
        <Parent />
        <Parent />
      </React.Fragment>
    );
    const Parent = () => [<Child key="one" />, <Child key="two" />];
    const Child = () => <div>Hi!</div>;

    ReactDOM.render(<Grandparent />, document.createElement('div'));

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();
  });

  it('should initialize a multiple root tree', () => {
    const Parent = () => [<Child key="one" />, <Child key="two" />];
    const Child = () => <div>Hi!</div>;

    ReactDOM.render(<Parent />, document.createElement('div'));
    ReactDOM.render(<Parent />, document.createElement('div'));

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();
  });
});
