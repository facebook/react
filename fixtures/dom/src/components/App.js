const React = window.React;
import Header from './Header';
import Fixtures from './fixtures';

import '../style.css';

function App () {
  return (
    <div>
      <Header />
      <div className="container" >
        <Fixtures />
      </div>
    </div>
  );
}

export default App;
