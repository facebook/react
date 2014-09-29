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

var WebComponent = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <ShadowRoot component={createCustomElementClass(this.props.tagName)}>
        {this.props.children}
      </ShadowRoot>
    );
  }
});

var PaperButton = React.createClass({
  render: function() {
    return (
      <WebComponent tagName="paper-button">
        <style>{css}</style>
        <h3>Hello world</h3>
      </WebComponent>
    );
  }
});

var Hello = React.createClass({
  render: function() {
    return (
      <div>
        <PaperButton />
      </div>
    );
  }
});
 
React.renderComponent(<Hello />, document.body);
