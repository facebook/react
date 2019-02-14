/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  describe('context', function() {
    let Context, PurpleContextProvider, RedContextProvider, Consumer;
    beforeEach(() => {
      Context = React.createContext('none');

      class Parent extends React.Component {
        render() {
          return (
            <Context.Provider value={this.props.text}>
              {this.props.children}
            </Context.Provider>
          );
        }
      }
      Consumer = Context.Consumer;
      PurpleContextProvider = props => (
        <Parent text="purple">{props.children}</Parent>
      );
      RedContextProvider = props => (
        <Parent text="red">{props.children}</Parent>
      );
    });

    itRenders('class child with context', async render => {
      class ClassChildWithContext extends React.Component {
        render() {
          return (
            <div>
              <Consumer>{text => text}</Consumer>
            </div>
          );
        }
      }

      const e = await render(
        <PurpleContextProvider>
          <ClassChildWithContext />
        </PurpleContextProvider>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('stateless child with context', async render => {
      function FunctionChildWithContext(props) {
        return <Consumer>{text => text}</Consumer>;
      }

      const e = await render(
        <PurpleContextProvider>
          <FunctionChildWithContext />
        </PurpleContextProvider>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('class child with default context', async render => {
      class ClassChildWithWrongContext extends React.Component {
        render() {
          return (
            <div id="classWrongChild">
              <Consumer>{text => text}</Consumer>
            </div>
          );
        }
      }

      const e = await render(<ClassChildWithWrongContext />);
      expect(e.textContent).toBe('none');
    });

    itRenders('stateless child with wrong context', async render => {
      function FunctionChildWithWrongContext(props) {
        return (
          <div id="statelessWrongChild">
            <Consumer>{text => text}</Consumer>
          </div>
        );
      }

      const e = await render(<FunctionChildWithWrongContext />);
      expect(e.textContent).toBe('none');
    });

    itRenders('with context passed through to a grandchild', async render => {
      function Grandchild(props) {
        return (
          <div>
            <Consumer>{text => text}</Consumer>
          </div>
        );
      }

      const Child = props => <Grandchild />;

      const e = await render(
        <PurpleContextProvider>
          <Child />
        </PurpleContextProvider>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('a child context overriding a parent context', async render => {
      const Grandchild = props => {
        return (
          <div>
            <Consumer>{text => text}</Consumer>
          </div>
        );
      };

      const e = await render(
        <PurpleContextProvider>
          <RedContextProvider>
            <Grandchild />
          </RedContextProvider>
        </PurpleContextProvider>,
      );
      expect(e.textContent).toBe('red');
    });

    itRenders('readContext() in different components', async render => {
      function readContext(Ctx, observedBits) {
        const dispatcher =
          React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
            .ReactCurrentDispatcher.current;
        return dispatcher.readContext(Ctx, observedBits);
      }

      class Cls extends React.Component {
        render() {
          return readContext(Context);
        }
      }
      function Fn() {
        return readContext(Context);
      }
      const Memo = React.memo(() => {
        return readContext(Context);
      });
      const FwdRef = React.forwardRef((props, ref) => {
        return readContext(Context);
      });

      const e = await render(
        <PurpleContextProvider>
          <RedContextProvider>
            <span>
              <Fn />
              <Cls />
              <Memo />
              <FwdRef />
              <Consumer>{() => readContext(Context)}</Consumer>
            </span>
          </RedContextProvider>
        </PurpleContextProvider>,
      );
      expect(e.textContent).toBe('redredredredred');
    });

    itRenders('multiple contexts', async render => {
      const Theme = React.createContext('dark');
      const Language = React.createContext('french');
      class Parent extends React.Component {
        render() {
          return (
            <Theme.Provider value="light">
              <Child />
            </Theme.Provider>
          );
        }
      }

      function Child() {
        return (
          <Language.Provider value="english">
            <Grandchild />
          </Language.Provider>
        );
      }

      const Grandchild = props => {
        return (
          <div>
            <Theme.Consumer>
              {theme => <div id="theme">{theme}</div>}
            </Theme.Consumer>
            <Language.Consumer>
              {language => <div id="language">{language}</div>}
            </Language.Consumer>
          </div>
        );
      };

      const e = await render(<Parent />);
      expect(e.querySelector('#theme').textContent).toBe('light');
      expect(e.querySelector('#language').textContent).toBe('english');
    });

    itRenders('nested context unwinding', async render => {
      const Theme = React.createContext('dark');
      const Language = React.createContext('french');

      const App = () => (
        <div>
          <Theme.Provider value="light">
            <Language.Provider value="english">
              <Theme.Provider value="dark">
                <Theme.Consumer>
                  {theme => <div id="theme1">{theme}</div>}
                </Theme.Consumer>
              </Theme.Provider>
              <Theme.Consumer>
                {theme => <div id="theme2">{theme}</div>}
              </Theme.Consumer>
              <Language.Provider value="sanskrit">
                <Theme.Provider value="blue">
                  <Theme.Provider value="red">
                    <Language.Consumer>
                      {() => (
                        <Language.Provider value="chinese">
                          <Language.Provider value="hungarian" />
                          <Language.Consumer>
                            {language => <div id="language1">{language}</div>}
                          </Language.Consumer>
                        </Language.Provider>
                      )}
                    </Language.Consumer>
                  </Theme.Provider>
                  <Language.Consumer>
                    {language => (
                      <React.Fragment>
                        <Theme.Consumer>
                          {theme => <div id="theme3">{theme}</div>}
                        </Theme.Consumer>
                        <div id="language2">{language}</div>
                      </React.Fragment>
                    )}
                  </Language.Consumer>
                </Theme.Provider>
              </Language.Provider>
            </Language.Provider>
          </Theme.Provider>
          <Language.Consumer>
            {language => <div id="language3">{language}</div>}
          </Language.Consumer>
        </div>
      );
      let e = await render(<App />);
      expect(e.querySelector('#theme1').textContent).toBe('dark');
      expect(e.querySelector('#theme2').textContent).toBe('light');
      expect(e.querySelector('#theme3').textContent).toBe('blue');
      expect(e.querySelector('#language1').textContent).toBe('chinese');
      expect(e.querySelector('#language2').textContent).toBe('sanskrit');
      expect(e.querySelector('#language3').textContent).toBe('french');
    });

    itRenders(
      'should warn with an error message when using Context as consumer in DEV',
      async render => {
        const Theme = React.createContext('dark');
        const Language = React.createContext('french');

        const App = () => (
          <div>
            <Theme.Provider value="light">
              <Language.Provider value="english">
                <Theme.Provider value="dark">
                  <Theme>{theme => <div id="theme1">{theme}</div>}</Theme>
                </Theme.Provider>
              </Language.Provider>
            </Theme.Provider>
          </div>
        );
        // We expect 1 error.
        await render(<App />, 1);
      },
    );

    // False positive regression test.
    itRenders(
      'should not warn when using Consumer from React < 16.6 with newer renderer',
      async render => {
        const Theme = React.createContext('dark');
        const Language = React.createContext('french');
        // React 16.5 and earlier didn't have a separate object.
        Theme.Consumer = Theme;

        const App = () => (
          <div>
            <Theme.Provider value="light">
              <Language.Provider value="english">
                <Theme.Provider value="dark">
                  <Theme>{theme => <div id="theme1">{theme}</div>}</Theme>
                </Theme.Provider>
              </Language.Provider>
            </Theme.Provider>
          </div>
        );
        // We expect 0 errors.
        await render(<App />, 0);
      },
    );

    itRenders(
      'should warn with an error message when using nested context consumers in DEV',
      async render => {
        const App = () => {
          const Theme = React.createContext('dark');
          const Language = React.createContext('french');

          return (
            <div>
              <Theme.Provider value="light">
                <Language.Provider value="english">
                  <Theme.Provider value="dark">
                    <Theme.Consumer.Consumer>
                      {theme => <div id="theme1">{theme}</div>}
                    </Theme.Consumer.Consumer>
                  </Theme.Provider>
                </Language.Provider>
              </Theme.Provider>
            </div>
          );
        };
        // We expect 1 error.
        await render(<App />, 1);
      },
    );

    itRenders(
      'should warn with an error message when using Context.Consumer.Provider DEV',
      async render => {
        const App = () => {
          const Theme = React.createContext('dark');
          const Language = React.createContext('french');

          return (
            <div>
              <Theme.Provider value="light">
                <Language.Provider value="english">
                  <Theme.Consumer.Provider value="dark">
                    <Theme.Consumer>
                      {theme => <div id="theme1">{theme}</div>}
                    </Theme.Consumer>
                  </Theme.Consumer.Provider>
                </Language.Provider>
              </Theme.Provider>
            </div>
          );
        };
        // We expect 1 error.
        await render(<App />, 1);
      },
    );

    it('does not pollute parallel node streams', () => {
      const LoggedInUser = React.createContext();

      const AppWithUser = user => (
        <LoggedInUser.Provider value={user}>
          <header>
            <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
          </header>
          <footer>
            <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
          </footer>
        </LoggedInUser.Provider>
      );

      const streamAmy = ReactDOMServer.renderToNodeStream(
        AppWithUser('Amy'),
      ).setEncoding('utf8');
      const streamBob = ReactDOMServer.renderToNodeStream(
        AppWithUser('Bob'),
      ).setEncoding('utf8');

      // Testing by filling the buffer using internal _read() with a small
      // number of bytes to avoid a test case which needs to align to a
      // highWaterMark boundary of 2^14 chars.
      streamAmy._read(20);
      streamBob._read(20);
      streamAmy._read(20);
      streamBob._read(20);

      expect(streamAmy.read()).toBe('<header>Amy</header><footer>Amy</footer>');
      expect(streamBob.read()).toBe('<header>Bob</header><footer>Bob</footer>');
    });

    it('does not pollute parallel node streams when many are used', () => {
      const CurrentIndex = React.createContext();

      const NthRender = index => (
        <CurrentIndex.Provider value={index}>
          <header>
            <CurrentIndex.Consumer>{idx => idx}</CurrentIndex.Consumer>
          </header>
          <footer>
            <CurrentIndex.Consumer>{idx => idx}</CurrentIndex.Consumer>
          </footer>
        </CurrentIndex.Provider>
      );

      let streams = [];

      // Test with more than 32 streams to test that growing the thread count
      // works properly.
      let streamCount = 34;

      for (let i = 0; i < streamCount; i++) {
        streams[i] = ReactDOMServer.renderToNodeStream(
          NthRender(i % 2 === 0 ? 'Expected to be recreated' : i),
        ).setEncoding('utf8');
      }

      // Testing by filling the buffer using internal _read() with a small
      // number of bytes to avoid a test case which needs to align to a
      // highWaterMark boundary of 2^14 chars.
      for (let i = 0; i < streamCount; i++) {
        streams[i]._read(20);
      }

      // Early destroy every other stream
      for (let i = 0; i < streamCount; i += 2) {
        streams[i].destroy();
      }

      // Recreate those same streams.
      for (let i = 0; i < streamCount; i += 2) {
        streams[i] = ReactDOMServer.renderToNodeStream(
          NthRender(i),
        ).setEncoding('utf8');
      }

      // Read a bit from all streams again.
      for (let i = 0; i < streamCount; i++) {
        streams[i]._read(20);
      }

      // Assert that all stream rendered the expected output.
      for (let i = 0; i < streamCount; i++) {
        expect(streams[i].read()).toBe(
          '<header>' + i + '</header><footer>' + i + '</footer>',
        );
      }
    });

    // Regression test for https://github.com/facebook/react/issues/14705
    it('does not pollute later renders when stream destroyed', () => {
      const LoggedInUser = React.createContext('default');

      const AppWithUser = user => (
        <LoggedInUser.Provider value={user}>
          <header>
            <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
          </header>
        </LoggedInUser.Provider>
      );

      const stream = ReactDOMServer.renderToNodeStream(
        AppWithUser('Amy'),
      ).setEncoding('utf8');

      // This is an implementation detail because we test a memory leak
      const {threadID} = stream.partialRenderer;

      // Read enough to render Provider but not enough for it to be exited
      stream._read(10);
      expect(LoggedInUser[threadID]).toBe('Amy');

      stream.destroy();

      const AppWithUserNoProvider = () => (
        <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
      );

      const stream2 = ReactDOMServer.renderToNodeStream(
        AppWithUserNoProvider(),
      ).setEncoding('utf8');

      // Sanity check to ensure 2nd render has same threadID as 1st render,
      // otherwise this test is not testing what it's meant to
      expect(stream2.partialRenderer.threadID).toBe(threadID);

      const markup = stream2.read(Infinity);

      expect(markup).toBe('default');
    });

    // Regression test for https://github.com/facebook/react/issues/14705
    it('frees context value reference when stream destroyed', () => {
      const LoggedInUser = React.createContext('default');

      const AppWithUser = user => (
        <LoggedInUser.Provider value={user}>
          <header>
            <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
          </header>
        </LoggedInUser.Provider>
      );

      const stream = ReactDOMServer.renderToNodeStream(
        AppWithUser('Amy'),
      ).setEncoding('utf8');

      // This is an implementation detail because we test a memory leak
      const {threadID} = stream.partialRenderer;

      // Read enough to render Provider but not enough for it to be exited
      stream._read(10);
      expect(LoggedInUser[threadID]).toBe('Amy');

      stream.destroy();
      expect(LoggedInUser[threadID]).toBe('default');
    });

    it('does not pollute sync renders after an error', () => {
      const LoggedInUser = React.createContext('default');
      const Crash = () => {
        throw new Error('Boo!');
      };
      const AppWithUser = user => (
        <LoggedInUser.Provider value={user}>
          <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>
          <Crash />
        </LoggedInUser.Provider>
      );

      expect(() => {
        ReactDOMServer.renderToString(AppWithUser('Casper'));
      }).toThrow('Boo');

      // Should not report a value from failed render
      expect(
        ReactDOMServer.renderToString(
          <LoggedInUser.Consumer>{whoAmI => whoAmI}</LoggedInUser.Consumer>,
        ),
      ).toBe('default');
    });
  });
});
