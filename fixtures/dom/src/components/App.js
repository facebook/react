import Header from './Header';
import Fixtures from './fixtures';
import '../style.css';

const React = window.React;

function App() {
  return (
    <div>
      <Header />
      <div className="container">
        <Fixtures />
      </div>
    </div>
  );
}

export default App;
