const React = window.React;
import Header from './Header';
import Fixtures from './fixtures';

import '../style.css';

const App = React.createClass({
  render() {
    return (
      <div>
        <Header />
        <div className="container" >
          <Fixtures />
        </div>
      </div>
    );
  },
});

export default App;
