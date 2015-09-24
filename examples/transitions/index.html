<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Example with Transitions</title>
    <link rel="stylesheet" href="../shared/css/base.css" />
    <link rel="stylesheet" href="transition.css" />
  </head>
  <body>
    <h1>Example with Transitions</h1>
    <div id="container">
      <p>
        To install React, follow the instructions on
        <a href="https://github.com/facebook/react/">GitHub</a>.
      </p>
      <p>
        If you can see this, React is not working right.
        If you checked out the source from GitHub make sure to run <code>grunt</code>.
      </p>
    </div>
    <h4>Example Details</h4>
    <p>This is written with JSX and transformed in the browser.</p>
    <p>
      Learn more about React at
      <a href="https://facebook.github.io/react" target="_blank">facebook.github.io/react</a>.
    </p>
    <script src="../../build/react-with-addons.js"></script>
    <script src="../../build/react-dom.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.24/browser.min.js"></script>
    <script type="text/babel">
      var CSSTransitionGroup = React.addons.CSSTransitionGroup;
      var INTERVAL = 2000;

      var AnimateDemo = React.createClass({
        getInitialState: function() {
          return {current: 0};
        },

        componentDidMount: function() {
          this.interval = setInterval(this.tick, INTERVAL);
        },

        componentWillUnmount: function() {
          clearInterval(this.interval);
        },

        tick: function() {
          this.setState({current: this.state.current + 1});
        },

        render: function() {
          var children = [];
          var pos = 0;
          var colors = ['red', 'gray', 'blue'];
          for (var i = this.state.current; i < this.state.current + colors.length; i++) {
            var style = {
              left: pos * 128,
              background: colors[i % colors.length]
            };
            pos++;
            children.push(<div key={i} className="animateItem" style={style}>{i}</div>);
          }
          return (
            <CSSTransitionGroup
              className="animateExample"
              transitionEnterTimeout={250}
              transitionLeaveTimeout={250}
              transitionName="example">
              {children}
            </CSSTransitionGroup>
          );
        }
      });

      ReactDOM.render(
        <AnimateDemo />,
        document.getElementById('container')
      );
    </script>
  </body>
</html>
