let React;
let ReactNoop;
let Scheduler;
let LegacyHidden;

describe('ReactOffscreen', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    LegacyHidden = React.unstable_LegacyHidden;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  // @gate experimental
  // @gate new
  it('unstable-defer-without-hiding should never toggle the visibility of its children', async () => {
    function App({mode}) {
      return (
        <>
          <Text text="Normal" />
          <LegacyHidden mode={mode}>
            <Text text="Deferred" />
          </LegacyHidden>
        </>
      );
    }

    // Test the initial mount
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App mode="unstable-defer-without-hiding" />);
      expect(Scheduler).toFlushUntilNextPaint(['Normal']);
      expect(root).toMatchRenderedOutput(<span prop="Normal" />);
    });
    expect(Scheduler).toHaveYielded(['Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );

    // Now try after an update
    await ReactNoop.act(async () => {
      root.render(<App mode="visible" />);
    });
    expect(Scheduler).toHaveYielded(['Normal', 'Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );

    await ReactNoop.act(async () => {
      root.render(<App mode="unstable-defer-without-hiding" />);
      expect(Scheduler).toFlushUntilNextPaint(['Normal']);
      expect(root).toMatchRenderedOutput(
        <>
          <span prop="Normal" />
          <span prop="Deferred" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded(['Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );
  });
});
