// @flow

import { setup } from './utils';

describe('sanity', () => {
  let React;
  let ReactDOM;
  let store;

  beforeEach(() => {
    store = setup();

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should pass', () => {
    function Grandparent() {
      return (
        <React.Fragment>
          <Parent />
          <Parent />
        </React.Fragment>
      );
    }

    function Parent() {
      return [<Child key="one" />, <Child key="two" />];
    }

    function Child() {
      return <div>Hi!</div>;
    }

    ReactDOM.render(<Grandparent />, document.createElement('div'));

    jest.runAllTimers(); // Flush Bridge operations

    expect(store).toMatchSnapshot();
  });
});
