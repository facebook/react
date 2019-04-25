let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;

describe('ReactBatchedMode', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function Text(props) {
    Scheduler.yieldValue(props.text);
    return props.text;
  }

  it('updates flush without yielding in the next event', () => {
    const root = ReactNoop.createSyncRoot();

    root.render(
      <React.Fragment>
        <Text text="A" />
        <Text text="B" />
        <Text text="C" />
      </React.Fragment>,
    );

    // Nothing should have rendered yet
    expect(root).toMatchRenderedOutput(null);

    // Everything should render immediately in the next event
    expect(Scheduler).toFlushExpired(['A', 'B', 'C']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  it('layout updates flush synchronously in same event', () => {
    const {useLayoutEffect} = React;

    function App() {
      useLayoutEffect(() => {
        Scheduler.yieldValue('Layout effect');
      });
      return <Text text="Hi" />;
    }

    const root = ReactNoop.createSyncRoot();
    root.render(<App />);
    expect(root).toMatchRenderedOutput(null);

    expect(Scheduler).toFlushExpired(['Hi', 'Layout effect']);
    expect(root).toMatchRenderedOutput('Hi');
  });
});
