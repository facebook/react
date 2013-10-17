/**
 * @jsx React.DOM
 */


var IS_MOBILE = (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
);

var CodeMirrorEditor = React.createClass({
  componentDidMount: function(root) {
    if (IS_MOBILE) {
      return;
    }
    this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
      mode: 'javascript',
      lineNumbers: false,
      matchBrackets: true,
      theme: 'solarized-light'
    });
    this.editor.on('change', this.onChange);
    this.onChange();
  },
  onChange: function() {
    if (this.props.onChange) {
      var content = this.editor.getValue();
      this.props.onChange(content);
    }
  },
  render: function() {
    // wrap in a div to fully contain CodeMirror
    var editor;

    if (IS_MOBILE) {
      editor = <pre style={{overflow: 'scroll'}}>{this.props.codeText}</pre>;
    } else {
      editor = <textarea ref="editor" defaultValue={this.props.codeText} />;
    }

    return (
      <div className={this.props.className}>
        {editor}
      </div>
    );
  }
});

var ReactPlayground = React.createClass({
  MODES: {XJS: 'XJS', JS: 'JS'}, //keyMirror({XJS: true, JS: true}),

  getInitialState: function() {
    return {mode: this.MODES.XJS, code: this.props.codeText};
  },

  bindState: function(name) {
    return function(value) {
      var newState = {};
      newState[name] = value;
      this.setState(newState);
    }.bind(this);
  },

  getDesugaredCode: function() {
    return JSXTransformer.transform(this.state.code).code;
  },

  render: function() {
    var content;
    if (this.state.mode === this.MODES.XJS) {
      content =
        <CodeMirrorEditor
          onChange={this.bindState('code')}
          className="playgroundStage"
          codeText={this.state.code}
        />;
    } else if (this.state.mode === this.MODES.JS) {
      content =
        <div className="playgroundJS playgroundStage">
            {this.getDesugaredCode()}
        </div>;
    }

    return (
      <div className="playground">
        <div className="playgroundCode">
          {content}
        </div>
        <div className="playgroundPreview">
          <div ref="mount" />
        </div>
      </div>
    );
  },
  componentDidMount: function() {
    this.executeCode();
  },
  componentDidUpdate: function() {
    this.executeCode();
  },
  executeCode: function() {
    var mountNode = this.refs.mount.getDOMNode();

    try {
      React.unmountAndReleaseReactRootNode(mountNode);
    } catch (e) { }

    try {
      if (this.props.renderCode) {
        React.renderComponent(
          <pre>{this.getDesugaredCode()}</pre>,
          mountNode
        );
      } else {
        eval(this.getDesugaredCode());
      }
    } catch (e) {
      React.renderComponent(
        <div content={e.toString()} className="playgroundError" />,
        mountNode
      );
    }
  }
});

