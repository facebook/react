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

var CodeMirrorEditor = React.createClass({displayName: 'CodeMirrorEditor',
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
      editor = React.DOM.pre( {style:{overflow: 'scroll'}}, this.props.codeText);
    } else {
      editor = React.DOM.textarea( {ref:"editor", defaultValue:this.props.codeText} );
    }

    return (
      React.DOM.div( {className:this.props.className}, 
        editor
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
          codeText:this.state.code}
        );
    } else if (this.state.mode === this.MODES.JS) {
      content =
        React.DOM.div( {className:"playgroundJS playgroundStage"}, 
            this.getDesugaredCode()
        );
    }

    return (
      React.DOM.div( {className:"playground"}, 
        React.DOM.div( {className:"playgroundCode"}, 
          content
        ),
        React.DOM.div( {className:"playgroundPreview"}, 
          React.DOM.div( {ref:"mount"} )
        )
      )
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
          React.DOM.pre(null, this.getDesugaredCode()),
          mountNode
        );
      } else {
        eval(this.getDesugaredCode());
      }
    } catch (e) {
      React.renderComponent(
        React.DOM.div( {content:e.toString(), className:"playgroundError"} ),
        mountNode
      );
    }
  }
});

