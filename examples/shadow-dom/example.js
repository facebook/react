/** @jsx React.DOM */

function createCustomElementClass(tagName) {
  if (typeof window !== 'undefined') {
    document.registerElement(tagName, {
      prototype: Object.create(HTMLElement.prototype)
    });
  }
  return React.DOM.createDOMComponentClass(false, tagName);
}

var ShadowRoot = React.createClass({
  getDefaultProps: function() {
    return {component: React.DOM.div};
  },
  
  render: function() {
    return this.props.component();
  },
  
  componentDidMount: function() {
    var shadowRoot = window.honk = this.getDOMNode().createShadowRoot();
    shadowRoot.innerHTML = '<span></span>';
    this._shadowRoot = shadowRoot.children[0];
    this.rerender();
  },
  
  componentDidUpdate: function() {
    this.rerender();
  },
  
  rerender: function() {
    React.renderComponent(<span>{this.props.children}</span>, this._shadowRoot);
  }
});

var PaperButton = React.createClass({
  render: function() {
    return (
      <ShadowRoot component={createCustomElementClass('paper-button')}>
        <style>{'h3 { color: blue; }'}</style>
        <h3>Hello world</h3>
      </ShadowRoot>
    );
  }
});

var Hello = React.createClass({
  getInitialState: function() {
    return {n: 0};
  },
  handleClick: function() {
    this.setState({n: this.state.n + 1});
  },
  render: function() {
    return <div><PaperButton /><h3>yolo</h3></div>;
  }
});
 
React.renderComponent(<Hello name="World" />, document.body);
