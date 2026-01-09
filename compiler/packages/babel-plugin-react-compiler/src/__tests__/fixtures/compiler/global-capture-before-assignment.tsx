import {useEffect, StrictMode} from 'react';

let i = 0;

function App() {
  useEffect(() => {
    const runNumber = i;
    console.log('effect run', runNumber);
    i += 1;
    return () => {
      console.log('cleanup run', runNumber);
    };
  }, []);
  return <div>OK</div>;
}

export function Main() {
  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Main,
  params: [{}],
};

