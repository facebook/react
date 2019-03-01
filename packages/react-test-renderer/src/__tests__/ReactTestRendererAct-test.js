jest.useRealTimers();

let React;
let ReactTestRenderer;
let act;

describe('ReactTestRenderer.act()', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    act = ReactTestRenderer.act;
  });
  it('can use .act() to flush effects', () => {
    function App(props) {
      let [ctr, setCtr] = React.useState(0);
      React.useEffect(() => {
        props.callback();
        setCtr(1);
      });
      return ctr;
    }
    let called = false;
    let root;
    act(() => {
      root = ReactTestRenderer.create(
        <App
          callback={() => {
            called = true;
          }}
        />,
      );
    });

    expect(called).toBe(true);
    expect(root.toJSON()).toEqual('1');
  });

  it("warns if you don't use .act", () => {
    let setCtr;
    function App(props) {
      let [ctr, _setCtr] = React.useState(0);
      setCtr = _setCtr;
      return ctr;
    }

    ReactTestRenderer.create(<App />);

    expect(() => {
      setCtr(1);
    }).toWarnDev([
      'An update to App inside a test was not wrapped in act(...)',
    ]);
  });

  describe('async', () => {
    it('should work with async/await', async () => {
      function App() {
        let [ctr, setCtr] = React.useState(0);
        async function someAsyncFunction() {
          await null;
          setCtr(1);
        }
        React.useEffect(() => {
          someAsyncFunction();
        }, []);
        return ctr;
      }
      let root;
      ReactTestRenderer.act(() => {
        root = ReactTestRenderer.create(<App />);
      });
      // using this 'workaround' because it looks like this is how
      // we're ticking over time in the other TestRenderer tests
      await act(async () => {
        await Promise.resolve();
      });

      expect(root.toJSON()).toEqual('1');

      // await ReactTestRenderer.act(async () => {
      //   // this test will fail
      //   // claiming to only fire the effect after this act call has exited

      //   // an odd situation
      //   // the sync version of act does not call the effect
      //   ReactTestRenderer.act(() => {
      //     root = ReactTestRenderer.create(<App />);
      //   });

      //   // the first workaround is to use the async version, which oddly works

      //   // another workaround is to do this -
      //   // await null
      //   // ReactTestRenderer.act(() => {});

      // // the third workaround is the one up ^ there, which we use to pass this test

      //   // this same test passes fine with the TestUtils sync version
      //   // or the async version of TestRenderer.act(...)
      // });
      // expect(root.toJSON()).toEqual('1');
    });
  });
});
