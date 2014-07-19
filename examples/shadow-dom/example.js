/** @jsx React.DOM */

var ShadowRoot = React.createClass({
  getDefaultProps: function() {
    return {component: React.DOM.div};
  },
  
  render: function() {
    return this.props.component();
  },
  
  componentDidMount: function() {
    var shadowRoot = window.honk = this.getDOMNode().createShadowRoot();
    shadowRoot.innerHTML = React.renderComponentToString(this.props.component());
    this._shadowRoot = shadowRoot.children[0];
    this.rerender();
  },
  
  componentDidUpdate: function() {
    this.rerender();
  },
  
  rerender: function() {
    React.renderComponent(this.props.component(null, this.props.children), this._shadowRoot);
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
    return <div><ShadowRoot><span onClick={this.handleClick}>Clicked {this.state.n} times</span></ShadowRoot></div>;
  }
});
 
React.renderComponent(<Hello name="World" />, document.body);
