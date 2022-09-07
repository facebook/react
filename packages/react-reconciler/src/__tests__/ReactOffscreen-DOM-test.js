let React;
let ReactDOMClient;
let Offscreen;
let container;
let act;
let useRef;

describe('ReactOffscreen', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Offscreen = React.unstable_Offscreen;
    act = require('jest-react').act;
    useRef = React.useRef;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // @gate enableOffscreen
  xit('does not attach event handlers by default', async () => {
    const onClick = jest.fn();
    let offscreenRef;

    function App({mode}) {
      offscreenRef = useRef(null);
      return (
        <Offscreen ref={offscreenRef} mode={null}>
          <span id="span-1" onClick={onClick} />
        </Offscreen>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<App mode={'visible'} />);
    });

    function click() {
      container
        .querySelector('#span-1')
        .dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
    }

    expect(offscreenRef.current).not.toBeNull();

    click();

    expect(onClick.mock.calls.length).toBe(1);

    offscreenRef.current.detach();

    click();

    expect(onClick.mock.calls.length).toBe(1);
  });
});
