/**
 * @jsx ReactDOM
 */

var React = require('React');

var MyApp = React.createComponent({

  showMessage: function() {
    alert('hello react!');
  },

  render: function() {
    return (
      <div onClick={this.showMessage.bind(this)}>
        Click Me
      </div>
    );
  }
});


// Only needed once per app.
React.renderComponent(<MyApp />, document.body);
