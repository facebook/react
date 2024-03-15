let React;
let ReactNoop;
let act;
let useState;

describe('possible useMemo invalidation bug', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    act = require('jest-react').act;
    useState = React.useState;
  });

  // @gate experimental || www
  test('caches values whose inputs are unchanged after setstate in render (useMemo)', async () => {
    let setX;
    function Component({limit}) {
      const [x, _setX] = useState(0);
      setX = _setX;

      // `x` is a controlled state that can't be set higher than the provided `limit`
      if (x > limit) {
        setX(limit);
      }

      // `obj` is an object that captures the value of `x`
      const obj = React.useMemo(
        // POSSIBLE BUG: because useMemo tries to reuse the WIP memo value after a setState-in-render,
        // the previous value is discarded. This means that even though the final render has the same
        // inputs as the last commit, the memoized value is discarded and recreated, breaking
        // memoization of all the child components down the tree.
        //
        // 1) First render: cache is initialized to {count: 0} with deps of [x=0, limit=10]
        // 2) Update: cache updated to {count: 10} with deps of [x=10, limit=10]
        // 3) Second update:
        // 3a) initially renders and caches {count: 12} with deps of [x=12, limit=10]
        // 3b) re-renders bc of setstate, caches {count: 10} with deps of [x=10, limit=10]
        // If this last step started from the `current` fiber's memo cache (from 2, instead of from 3a),
        // then it would not re-execute and preserve object identity
        () => {
          return {count: x};
        },
        // Note that `limit` isn't technically a dependency,
        // it's included here to show that even if we modeled that
        // `x` can depend on the value of `limit`, it isn't sufficient
        // to avoid breaking memoization across renders
        [x, limit],
      );

      return <Child obj={obj} />;
    }

    const Child = React.memo(function Child({obj}) {
      const text = React.useMemo(() => {
        return {text: `Count ${obj.count}`};
      }, [obj]);
      return <Text value={text} />;
    });

    // Text should only ever re-render if the object identity of `value`
    // changes.
    let renderCount = 0;
    const Text = React.memo(function Text({value}) {
      renderCount++;
      return value.text;
    });

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Component limit={10} />);
    });
    expect(root).toMatchRenderedOutput('Count 0');
    expect(renderCount).toBe(1);

    await act(async () => {
      setX(10); // set to the limit
    });
    expect(root).toMatchRenderedOutput('Count 10');
    expect(renderCount).toBe(2);

    await act(async () => {
      setX(12); // exceeds limit, will be reset in setState during render
    });
    expect(root).toMatchRenderedOutput('Count 10');
    expect(renderCount).toBe(2); // should not re-render, since value has not changed
  });
});
