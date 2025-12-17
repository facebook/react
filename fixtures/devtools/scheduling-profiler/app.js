const {createElement, useLayoutEffect, useState} = React;
const {createRoot} = ReactDOM;

function App() {
  const [isMounted, setIsMounted] = useState(false);
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);
  return createElement('div', null, `isMounted? ${isMounted}`);
}

const container = document.getElementById('container');
const root = createRoot(container);
root.render(createElement(App));
