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

  it('should support mount and update operations', () => {
    const Grandparent = ({ count }) => (
      <React.Fragment>
        <Parent count={count} />
        <Parent count={count} />
      </React.Fragment>
    );
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const container = document.createElement('div');

    ReactDOM.render(<Grandparent count={4} />, container);

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();

    ReactDOM.render(<Grandparent count={2} />, container);

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();
  });

  it('should support mount and update operations for multiple roots', () => {
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    ReactDOM.render(<Parent count={3} />, containerA);
    ReactDOM.render(<Parent count={2} />, containerB);

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();

    ReactDOM.render(<Parent count={4} />, containerA);
    ReactDOM.render(<Parent count={1} />, containerB);

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();
  });
});
