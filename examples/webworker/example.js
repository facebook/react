/**
 * @jsx React.DOM
 */

if (typeof React === 'undefined') {
  importScripts('../../build/react-with-workers.js');
}

React.Worker.run('./example.js', [], function() {
  var ExampleApplication = React.createClass({
    getInitialState: function() {
      return {red: false};
    },
    toggle: function() {
      this.setState({red: !this.state.red});
    },
    render: function() {
      var elapsed = Math.round(this.props.elapsed  / 100);
      var seconds = elapsed / 10 + (elapsed % 10 ? '' : '.0' );
      var message =
        'React has been successfully running for ' + seconds + ' seconds.';

      return React.DOM.p({onClick: this.toggle, style: {color: this.state.red ? 'red' : 'blue'}}, message);
    }
  });

  var start = new Date().getTime();

  setInterval(function() {
    try {
      React.renderComponent(
        ExampleApplication({elapsed: new Date().getTime() - start}),
        'container'
      );
    } catch (e) {
      console.log(e.stack);
    }
  }, 50);
});
