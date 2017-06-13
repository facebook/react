'use strict';

var _jsxFileName = '_js/live_editor.js';
var IS_MOBILE = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);

var CodeMirrorEditor = React.createClass({
  displayName: 'CodeMirrorEditor',

  propTypes: {
    lineNumbers: React.PropTypes.bool,
    onChange: React.PropTypes.func
  },
  getDefaultProps: function () {
    return {
      lineNumbers: false
    };
  },
  componentDidMount: function () {
    if (IS_MOBILE) return;

    this.editor = CodeMirror.fromTextArea(ReactDOM.findDOMNode(this.refs.editor), {
      mode: 'jsx',
      lineNumbers: this.props.lineNumbers,
      lineWrapping: true,
      smartIndent: false, // javascript mode does bad things with jsx indents
      matchBrackets: true,
      theme: 'solarized-light',
      readOnly: this.props.readOnly
    });
    this.editor.on('change', this.handleChange);
  },

  componentDidUpdate: function () {
    if (this.props.readOnly) {
      this.editor.setValue(this.props.codeText);
    }
  },

  handleChange: function () {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },

  render: function () {
    // wrap in a div to fully contain CodeMirror
    var editor;

    if (IS_MOBILE) {
      editor = React.createElement(
        'pre',
        { style: { overflow: 'scroll' }, __source: {
            fileName: _jsxFileName,
            lineNumber: 53
          }
        },
        this.props.codeText
      );
    } else {
      editor = React.createElement('textarea', { ref: 'editor', defaultValue: this.props.codeText, __source: {
          fileName: _jsxFileName,
          lineNumber: 55
        }
      });
    }

    return React.createElement(
      'div',
      { style: this.props.style, className: this.props.className, __source: {
          fileName: _jsxFileName,
          lineNumber: 59
        }
      },
      editor
    );
  }
});

var selfCleaningTimeout = {
  componentDidUpdate: function () {
    clearTimeout(this.timeoutID);
  },

  setTimeout: function () {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }
};

var ReactPlayground = React.createClass({
  displayName: 'ReactPlayground',

  mixins: [selfCleaningTimeout],

  MODES: { JSX: 'JSX', JS: 'JS' }, //keyMirror({JSX: true, JS: true}),

  propTypes: {
    codeText: React.PropTypes.string.isRequired,
    transformer: React.PropTypes.func,
    renderCode: React.PropTypes.bool,
    showCompiledJSTab: React.PropTypes.bool,
    showLineNumbers: React.PropTypes.bool,
    editorTabTitle: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      transformer: function (code, options) {
        var presets = ['react'];
        if (!options || !options.skipES2015Transform) {
          presets.push('es2015');
        }
        return Babel.transform(code, {
          presets: presets
        }).code;
      },
      editorTabTitle: 'Live JSX Editor',
      showCompiledJSTab: true,
      showLineNumbers: false
    };
  },

  getInitialState: function () {
    return {
      mode: this.MODES.JSX,
      code: this.props.codeText
    };
  },

  handleCodeChange: function (value) {
    this.setState({ code: value });
    this.executeCode();
  },

  handleCodeModeSwitch: function (mode) {
    this.setState({ mode: mode });
  },

  compileCode: function (options) {
    return this.props.transformer(this.state.code, options);
  },

  render: function () {
    var isJS = this.state.mode === this.MODES.JS;
    var compiledCode = '';
    try {
      compiledCode = this.compileCode({ skipES2015Transform: true });
    } catch (err) {}

    var JSContent = React.createElement(CodeMirrorEditor, {
      key: 'js',
      className: 'playgroundStage CodeMirror-readonly',
      onChange: this.handleCodeChange,
      codeText: compiledCode,
      readOnly: true,
      lineNumbers: this.props.showLineNumbers,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 136
      }
    });

    var JSXContent = React.createElement(CodeMirrorEditor, {
      key: 'jsx',
      onChange: this.handleCodeChange,
      className: 'playgroundStage',
      codeText: this.state.code,
      lineNumbers: this.props.showLineNumbers,
      __source: {
        fileName: _jsxFileName,
        lineNumber: 146
      }
    });

    var JSXTabClassName = 'playground-tab' + (isJS ? '' : ' playground-tab-active');
    var JSTabClassName = 'playground-tab' + (isJS ? ' playground-tab-active' : '');

    var JSTab = React.createElement(
      'div',
      {
        className: JSTabClassName,
        onClick: this.handleCodeModeSwitch.bind(this, this.MODES.JS), __source: {
          fileName: _jsxFileName,
          lineNumber: 160
        }
      },
      'Compiled JS'
    );

    var JSXTab = React.createElement(
      'div',
      {
        className: JSXTabClassName,
        onClick: this.handleCodeModeSwitch.bind(this, this.MODES.JSX), __source: {
          fileName: _jsxFileName,
          lineNumber: 167
        }
      },
      this.props.editorTabTitle
    );

    return React.createElement(
      'div',
      { className: 'playground', __source: {
          fileName: _jsxFileName,
          lineNumber: 174
        }
      },
      React.createElement(
        'div',
        {
          __source: {
            fileName: _jsxFileName,
            lineNumber: 175
          }
        },
        JSXTab,
        this.props.showCompiledJSTab && JSTab
      ),
      React.createElement(
        'div',
        { className: 'playgroundCode', __source: {
            fileName: _jsxFileName,
            lineNumber: 179
          }
        },
        isJS ? JSContent : JSXContent
      ),
      React.createElement(
        'div',
        { className: 'playgroundPreview', __source: {
            fileName: _jsxFileName,
            lineNumber: 182
          }
        },
        React.createElement('div', { ref: 'mount', __source: {
            fileName: _jsxFileName,
            lineNumber: 183
          }
        })
      )
    );
  },

  componentDidMount: function () {
    this.executeCode();
  },

  componentDidUpdate: function (prevProps, prevState) {
    // execute code only when the state's not being updated by switching tab
    // this avoids re-displaying the error, which comes after a certain delay
    if (this.props.transformer !== prevProps.transformer || this.state.code !== prevState.code) {
      this.executeCode();
    }
  },

  executeCode: function () {
    var mountNode = ReactDOM.findDOMNode(this.refs.mount);

    try {
      ReactDOM.unmountComponentAtNode(mountNode);
    } catch (e) {}

    try {
      var compiledCode;
      if (this.props.renderCode) {
        compiledCode = this.compileCode({ skipES2015Transform: true });
        ReactDOM.render(React.createElement(CodeMirrorEditor, { codeText: compiledCode, readOnly: true, __source: {
            fileName: _jsxFileName,
            lineNumber: 214
          }
        }), mountNode);
      } else {
        compiledCode = this.compileCode({ skipES2015Transform: false });
        eval(compiledCode);
      }
    } catch (err) {
      // Babel errors are preformatted, runtime errors are not.
      var errorMessage = err._babel ? React.createElement(
        'pre',
        { style: { overflowX: 'auto' }, className: 'playgroundError', __source: {
            fileName: _jsxFileName,
            lineNumber: 224
          }
        },
        err.toString()
      ) : React.createElement(
        'div',
        { className: 'playgroundError', __source: {
            fileName: _jsxFileName,
            lineNumber: 225
          }
        },
        err.toString()
      );
      this.setTimeout(function () {
        ReactDOM.render(errorMessage, mountNode);
      }, 500);
    }
  }
});