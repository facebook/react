import Header from './Header';
import Fixtures from './fixtures';
import '../style.css';

const React = window.React;

class App extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Fixtures />
      </div>
    );
  }
}

export default App;
