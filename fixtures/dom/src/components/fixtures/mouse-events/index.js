const React = window.React;

const Rectangle = ({style, ...props}) => (
  <div {...props} style={{border: '1px solid black', padding: 40, ...style}} />
);

class MouseEventsFixtures extends React.Component {
  state = {log: []};

  log = msg => {
    this.setState(({log}) => ({
      log: log.concat(msg),
    }));
  };
  clearLog = () => {
    this.setState({log: []});
  };
  render() {
    let getLogger = prefix => e => this.log(`${prefix}: ${e.type}`);
    let outerLogger = getLogger('outer');
    let innerLogger = getLogger('inner');

    return (
      <div>
        <div className="container">
          <p>
            Mouse the mouse between the two rectangles. The console should
            only log for a given box when the mouse crosses into the box the first
            time and again when the mouse exits the
            {' '}
            <em>outer</em>
            {' '}
            bounds of each box.
          </p>
          <Rectangle onMouseEnter={outerLogger} onMouseLeave={outerLogger}>
            <Rectangle onMouseEnter={innerLogger} onMouseLeave={innerLogger} />
          </Rectangle>
        </div>

        <div className="container">
          <h4>Console: <button onClick={this.clearLog}>clear</button></h4>
          <pre className="output">
            {this.state.log.join('\n')}
          </pre>
        </div>
      </div>
    );
  }
}

module.exports = MouseEventsFixtures;
