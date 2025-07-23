import React from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';
import BuggyComponent from './BuggyComponent';

function App() {
  return (
    <>
      <h2>React 19 Error Boundary Demo</h2>
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    </>
  );
}

export default App;
