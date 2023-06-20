let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let Catch;
let createCatch;

describe('ReactCatch', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    Catch = React.experimental_Catch;
    createCatch = React.experimental_createCatch;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  // TODO: This API is not fully implemented yet. This test just confirms that
  // the API is exposed and the component type is recognized by React.
  // @gate enableCreateCatch
  test('<Catch> API exists', async () => {
    const TypedCatch = createCatch();

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <Catch>
          <TypedCatch>
            <Text text="Hi!" />
          </TypedCatch>
        </Catch>,
      );
    });
    assertLog(['Hi!']);
    expect(root).toMatchRenderedOutput('Hi!');
  });
});
