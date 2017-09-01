/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Remarkable from 'remarkable';
import Flex from 'components/Flex';
import {LiveProvider, LiveEditor} from 'react-live';
import {colors, media} from 'theme';

const compile = code =>
  Babel.transform(code, {presets: ['es2015', 'react']}).code; // eslint-disable-line no-undef

class CodeEditor extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = this._updateState(props.code);
  }

  componentDidMount() {
    // Initial render() will always be a no-op,
    // Because the mountNode ref won't exist yet.
    this._render();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.compiled !== this.state.compiled) {
      this._render();
    }
  }

  render() {
    const {children, code} = this.props;
    const {error} = this.state;

    return (
      <LiveProvider code={code} mountStylesheet={false}>
        <div
          css={{
            display: 'flex',
            flexDirection: 'row',
            [media.largeDown]: {
              flexDirection: 'column',
            },
          }}>
          {children &&
            <div
              css={{
                flex: '0 0 33%',

                [media.largeDown]: {
                  marginBottom: 20,
                },

                '& h3': {
                  color: colors.dark,
                  maxWidth: '11em',
                },

                '& p': {
                  marginTop: 15,
                  marginRight: 40,

                  [media.xlargeUp]: {
                    marginTop: 25,
                  },
                },
              }}>
              {children}
            </div>}

          <div
            css={{
              display: 'flex',
              flex: '0 0 67%',
              alignItems: 'stretch',
              flexDirection: 'row',
              [media.smallDown]: {
                flexDirection: 'column',
              },
            }}>
            <Flex shrink="0" basis="50%" halign="flex-end">
              <div
                css={{
                  height: '100%',
                  width: '100%',
                  borderRadius: '10px 0 0 10px !important',
                  marginTop: '0 !important',

                  [media.smallDown]: {
                    borderRadius: '10px 10px 0 0 !important',
                  },

                  '& pre.prism-code[contenteditable]': {
                    maxHeight: '280px !important',
                    outline: 0,
                  },
                }}
                className="gatsby-highlight">
                <LiveEditor onChange={this._onChange} />
              </div>
            </Flex>
            {error &&
              <div
                css={{
                  flex: '0 0 50%',
                  overflow: 'hidden',
                  border: `1px solid ${colors.error}`,
                  borderRadius: '0 10px 10px 0',

                  [media.smallDown]: {
                    borderRadius: '0 0 10px 10px',
                  },
                }}>
                <div
                  css={{
                    padding: '0 10px',
                    background: colors.error,
                    color: colors.white,
                  }}>
                  Error
                </div>
                <pre
                  css={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: colors.error,
                    padding: 10,
                  }}>
                  {error.message}
                </pre>
              </div>}
            {!error &&
              <div
                css={{
                  flex: '0 0 50%',
                  overflow: 'hidden',
                  border: `1px solid ${colors.divider}`,
                  borderRadius: '0 10px 10px 0',

                  [media.smallDown]: {
                    borderRadius: '0 0 10px 10px',
                  },
                }}>
                <div
                  css={{
                    padding: 10,
                    backgroundColor: colors.divider,
                  }}>
                  Result
                </div>
                <div
                  css={{
                    padding: 10,

                    '& input': {
                      width: '100%',
                      display: 'block',
                      border: '1px solid #ccc', // TODO
                      padding: 5,
                    },

                    '& button': {
                      marginTop: 10,
                      padding: '5px 10px',
                    },

                    '& textarea': {
                      width: '100%',
                      marginTop: 10,
                      height: 60,
                      padding: 5,
                    },
                  }}
                  ref={this._setMountRef}
                />
              </div>}
          </div>
        </div>
      </LiveProvider>
    );
  }

  _render() {
    if (!this._mountNode) {
      return;
    }

    const {compiled} = this.state;

    try {
      // Example code requires React, ReactDOM, and Remarkable to be within scope.
      // It also requires a "mountNode" variable for ReactDOM.render()
      // eslint-disable-next-line no-new-func
      new Function('React', 'ReactDOM', 'Remarkable', 'mountNode', compiled)(
        React,
        ReactDOM,
        Remarkable,
        this._mountNode,
      );
    } catch (error) {
      console.error(error);

      this.setState({
        compiled: null,
        error,
      });
    }
  }

  _setMountRef = ref => {
    this._mountNode = ref;
  };

  _updateState(code) {
    try {
      return {
        compiled: compile(code),
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        compiled: null,
        error,
      };
    }
  }

  _onChange = code => {
    this.setState(this._updateState(code));
  };
}

export default CodeEditor;
