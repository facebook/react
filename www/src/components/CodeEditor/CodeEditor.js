import {transform} from 'babel-standalone';
import cn from 'classnames';
import React from 'react';
import {LiveProvider, LiveEditor} from 'react-live';
import styles from './CodeEditor.module.scss';

const compile = code => transform(code, {presets: ['es2015', 'react']}).code;

class CodeEditor extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = this._updateState(props.code);
  }

  componentDidMount() {
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
        <div className={styles.Wrapper}>
          {children &&
            <div className={styles.Description}>
              {children}
            </div>}

          <div className={styles.CodeEditor}>
            <div className={styles.Input}>
              <div className={cn(styles.Prism, 'gatsby-highlight')}>
                <LiveEditor onChange={this._onChange} />
              </div>
            </div>
            {error &&
              <div className={styles.Error}>
                <div className={styles.ErrorHeader}>Error</div>
                <pre className={styles.ErrorMessage}>{error.message}</pre>
              </div>}
            {!error &&
              <div className={styles.Preview}>
                <div className={styles.PreviewHeader}>Result</div>
                <div className={styles.PreviewBody} ref={this._setMountRef} />
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

    // Evaluated code references local "mountNode" variable by convention.
    // eslint-disable-next-line no-unused-vars
    const mountNode = this._mountNode;

    // Evaluated code references React and ReactDOM (as globals).
    // Make sure they're visible to the eval'ed code.
    const React = require('react');
    const ReactDOM = require('react-dom');

    // HACK Remarkable plugin is used in one of the examples too.
    const Remarkable = require('remarkable');

    // eslint-disable-next-line no-eval
    eval(compiled);
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
