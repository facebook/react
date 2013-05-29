/**
 * @jsx React.DOM
 */

var CodeMirrorEditor = React.createClass({displayName: 'CodeMirrorEditor',
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
      React.DOM.div( {className:this.props.className}, 
        React.DOM.textarea( {ref:"editor"}, this.props.codeText)
      )
    );
  }
});

var ReactPlayground = React.createClass({displayName: 'ReactPlayground',
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
        CodeMirrorEditor(
          {onChange:this.bindState('code'),
          className:"playgroundStage",
          codeText:this.state.code}, null
        );
    } else if (this.state.mode === this.MODES.JS) {
      content =
        React.DOM.div( {className:{playgroundJS: true, playgroundStage: true}}, 
            this.getDesugaredCode()
        );
    }

    return (
      React.DOM.div( {className:"playground"}, [
        React.DOM.div( {className:"playgroundCode"}, 
          content
        ),
        React.DOM.div( {className:"playgroundPreview"}, 
          React.DOM.div( {ref:"mount"}, null )
        )
      ])
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
      React.renderComponent(React.DOM.div( {content:e.toString(), className:{playgroundError: true}}, null ), mountNode);
    }
  }
});

