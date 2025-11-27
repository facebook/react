// Example file to test React Error Assistant - MODULE_NOT_FOUND in BUILD MODE
// This will trigger: Module not found error during vite build

import {useState} from 'react';

// Simple Button component
function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', margin: '4px' }}>
      {children}
    </button>
  );
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Test App</h1>

      {/* 
        ERROR TYPE: MODULE_NOT_FOUND
        Expected during build: "Failed to resolve import './components/Button'"
        Trigger: Run `yarn build` (after fixing TypeScript errors if any)
      */}
      <div>Current count: {count}</div>
      <Button onClick={() => setCount(count + 1}>Test Button</Button>
    </div>
  );
}

export default App;
