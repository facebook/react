const React = window.React;
import Header from './Header';
import Fixtures from './fixtures';
import '../styles/App.css';

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
