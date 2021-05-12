let React;
let ReactNoop;
let Scheduler;

describe('ReactClassSetStateCallback', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  test('regression: setState callback (2nd arg) should only fire once, even after a rebase', async () => {
    let app;
    class App extends React.Component {
      state = {step: 0};
      render() {
        app = this;
        return <Text text={this.state.step} />;
      }
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([0]);

    await ReactNoop.act(async () => {
      app.setState({step: 1}, () =>
        Scheduler.unstable_yieldValue('Callback 1'),
      );
      ReactNoop.flushSync(() => {
        app.setState({step: 2}, () =>
          Scheduler.unstable_yieldValue('Callback 2'),
        );
      });
    });
    expect(Scheduler).toHaveYielded([2, 'Callback 2', 2, 'Callback 1']);
  });
});
