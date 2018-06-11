/**
 * Copyright (c) 2013-present, Facebook, Inc.
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
    let PurpleContext, RedContext, Consumer;
    beforeEach(() => {
      let Context = React.createContext('none');

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
      PurpleContext = props => <Parent text="purple">{props.children}</Parent>;
      RedContext = props => <Parent text="red">{props.children}</Parent>;
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
        <PurpleContext>
          <ClassChildWithContext />
        </PurpleContext>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('stateless child with context', async render => {
      function StatelessChildWithContext(props) {
        return <Consumer>{text => text}</Consumer>;
      }

      const e = await render(
        <PurpleContext>
          <StatelessChildWithContext />
        </PurpleContext>,
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
      function StatelessChildWithWrongContext(props) {
        return (
          <div id="statelessWrongChild">
            <Consumer>{text => text}</Consumer>
          </div>
        );
      }

      const e = await render(<StatelessChildWithWrongContext />);
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
        <PurpleContext>
          <Child />
        </PurpleContext>,
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
        <PurpleContext>
          <RedContext>
            <Grandchild />
          </RedContext>
        </PurpleContext>,
      );
      expect(e.textContent).toBe('red');
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
  });
});
