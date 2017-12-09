const React = global.React;

function wait(time) {
  console.log('Blocking!');
  var startTime = new Date().getTime();
  var endTime = startTime + time;
  while (new Date().getTime() < endTime) {
    // wait for it...
  }
  console.log('Not blocking!');
}

var scrollable = {
  width: 300,
  height: 200,
  overflowY: 'auto',
  margin: '0 auto',
  background: '#ededed',
};

class ScrollFixture extends React.Component {
  componentDidMount() {
    // jank up the main thread!
    this.jank = setInterval(() => wait(3000), 4000);
  }

  componentWillUnmount() {
    clearInterval(this.jank);
  }

  onWheel() {
    console.log('wheel');
  }

  onTouchStart() {
    console.log('touch start');
  }

  onTouchMove() {
    console.log('touch move');
  }

  render() {
    let listItems = [];

    // This is to produce a long enough page to allow for scrolling
    for (var i = 0; i < 50; i++) {
      listItems.push(<li key={i}>List item #{i + 1}</li>);
    }

    return (
      <section>
        <h2>Scroll Testing</h2>
        <p>
          Mouse wheel, track pad scroll, and touch events should not be blocked
          by JS execution in IE Edge, Safari, and Firefox.
        </p>
        <div
          style={scrollable}
          onTouchStart={this.onTouchStart}
          onTouchMove={this.onTouchMove}
          onWheel={this.onWheel}>
          <h2>I am scrollable!</h2>
          <ul>{listItems}</ul>
        </div>
        <ul>{listItems}</ul>
      </section>
    );
  }
}

export default ScrollFixture;
