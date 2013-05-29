/**
 * @jsx React.DOM
 */

var CodeMirrorEditor = React.createClass({
  componentDidMount: function(root) {
    this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
      mode: 'javascript',
      lineNumbers: false,
      matchBrackets: true,
      theme: 'solarized-light'
    });
    this.editor.on('change', this.onChange.bind(this));
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
    return (
      <div class={this.props.className}>
        <textarea ref="editor">{this.props.codeText}</textarea>
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
          class="playgroundStage"
          codeText={this.state.code}
        />;
    } else if (this.state.mode === this.MODES.JS) {
      content =
        <div class={{playgroundJS: true, playgroundStage: true}}>
            {this.getDesugaredCode()}
        </div>;
    }

    return (
      <div class="playground">
        <div class="playgroundCode">
          {content}
        </div>
        <div class="playgroundPreview">
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
      eval(this.getDesugaredCode());
    } catch (e) {
      React.renderComponent(<div content={e.toString()} class={{playgroundError: true}} />, mountNode);
    }
  }
});

