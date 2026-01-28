import TestCase from '../../TestCase';
import Fixture from '../../Fixture';
import PrintRectsFragmentContainer from './PrintRectsFragmentContainer';

const React = window.React;
const {Fragment, useRef, useState} = React;

function GetClientRectsTextOnly() {
  return (
    <TestCase title="getClientRects - Text Only">
      <TestCase.Steps>
        <li>Click the "Print Rects" button</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        The fragment contains only text nodes. getClientRects should return
        bounding rectangles for the text content using the Range API.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <PrintRectsFragmentContainer>
            This is text content inside a fragment with no element children.
          </PrintRectsFragmentContainer>
        </Fixture.Controls>
      </Fixture>
    </TestCase>
  );
}

function GetClientRectsMixed() {
  return (
    <TestCase title="getClientRects - Mixed Content">
      <TestCase.Steps>
        <li>Click the "Print Rects" button</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        The fragment contains both text nodes and elements. getClientRects
        should return bounding rectangles for both text content (via Range API)
        and elements.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <PrintRectsFragmentContainer>
            Text before the span.
            <span
              style={{
                display: 'inline-block',
                padding: '5px 10px',
                backgroundColor: 'lightblue',
                border: '1px solid blue',
                margin: '0 5px',
              }}>
              Element
            </span>
            Text after the span.
            <div
              style={{
                width: '500px',
                height: '50px',
                backgroundColor: 'lightpink',
                border: '1px solid black',
              }}></div>
            More text at the end.
          </PrintRectsFragmentContainer>
        </Fixture.Controls>
      </Fixture>
    </TestCase>
  );
}

function FocusTextOnlyNoop() {
  const fragmentRef = useRef(null);
  const [message, setMessage] = useState('');

  const tryFocus = () => {
    fragmentRef.current.focus();
    setMessage('Called focus() - no-op for text-only fragments');
  };

  const tryFocusLast = () => {
    fragmentRef.current.focusLast();
    setMessage('Called focusLast() - no-op for text-only fragments');
  };

  return (
    <TestCase title="focus/focusLast - Text Only (No-op)">
      <TestCase.Steps>
        <li>Click either focus button</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        Calling focus() or focusLast() on a fragment with only text children is
        a no-op. Nothing happens and no warning is logged. This is because text
        nodes cannot receive focus.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <button onClick={tryFocus}>focus()</button>
          <button onClick={tryFocusLast}>focusLast()</button>
          {message && (
            <div style={{marginTop: '10px', color: '#666'}}>{message}</div>
          )}
        </Fixture.Controls>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
          }}>
          <Fragment ref={fragmentRef}>
            This fragment contains only text. Text nodes are not focusable.
          </Fragment>
        </div>
      </Fixture>
    </TestCase>
  );
}

function ScrollIntoViewTextOnly() {
  const fragmentRef = useRef(null);
  const [message, setMessage] = useState('');

  const tryScrollIntoView = alignToTop => {
    fragmentRef.current.scrollIntoView(alignToTop);
    setMessage(
      `Called scrollIntoView(${alignToTop}) - page should scroll to text`
    );
  };

  return (
    <TestCase title="scrollIntoView - Text Only">
      <TestCase.Steps>
        <li>Scroll down the page so the text fragment is not visible</li>
        <li>Click one of the scrollIntoView buttons</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        The page should scroll to bring the text content into view. With
        alignToTop=true, the text should appear at the top of the viewport. With
        alignToTop=false, it should appear at the bottom. This uses the Range
        API to calculate text node positions.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <button onClick={() => tryScrollIntoView(true)}>
            scrollIntoView(true)
          </button>
          <button onClick={() => tryScrollIntoView(false)}>
            scrollIntoView(false)
          </button>
          {message && (
            <div style={{marginTop: '10px', color: 'green'}}>{message}</div>
          )}
        </Fixture.Controls>
        <div
          style={{
            marginTop: '100vh',
            marginBottom: '100vh',
            padding: '20px',
            backgroundColor: '#f0fff0',
            border: '1px solid #cfc',
          }}>
          <Fragment ref={fragmentRef}>
            This fragment contains only text. The scrollIntoView method uses the
            Range API to calculate the text position and scroll to it.
          </Fragment>
        </div>
      </Fixture>
    </TestCase>
  );
}

function ScrollIntoViewMixed() {
  const fragmentRef = useRef(null);
  const [message, setMessage] = useState('');

  const tryScrollIntoView = alignToTop => {
    fragmentRef.current.scrollIntoView(alignToTop);
    setMessage(
      `Called scrollIntoView(${alignToTop}) - page should scroll to fragment`
    );
  };

  const targetStyle = {
    height: 300,
    marginBottom: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
  };

  return (
    <TestCase title="scrollIntoView - Mixed Content">
      <TestCase.Steps>
        <li>Scroll down the page so the fragment is not visible</li>
        <li>Click one of the scrollIntoView buttons</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        The fragment contains raw text nodes (not wrapped in elements) and
        elements in alternating order. With alignToTop=true, scroll starts from
        the last child and works backwards, ending with the first text node at
        the top. With alignToTop=false, scroll starts from the first child and
        works forward, ending with the last text node at the bottom. Text nodes
        use the Range API for scrolling.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <button onClick={() => tryScrollIntoView(true)}>
            scrollIntoView(true)
          </button>
          <button onClick={() => tryScrollIntoView(false)}>
            scrollIntoView(false)
          </button>
          {message && (
            <div style={{marginTop: '10px', color: 'green'}}>{message}</div>
          )}
        </Fixture.Controls>
        <div
          style={{
            marginTop: '100vh',
            marginBottom: '100vh',
            whiteSpace: 'pre-wrap',
            lineHeight: '2',
          }}>
          <Fragment ref={fragmentRef}>
            TEXT NODE 1 - This is a raw text node at the start of the fragment
            <div style={{...targetStyle, backgroundColor: 'lightyellow'}}>
              ELEMENT 1
            </div>
            TEXT NODE 2 - This is a raw text node between elements
            <div style={{...targetStyle, backgroundColor: 'lightpink'}}>
              ELEMENT 2
            </div>
            TEXT NODE 3 - This is a raw text node between elements
            <div style={{...targetStyle, backgroundColor: 'lightcyan'}}>
              ELEMENT 3
            </div>
            TEXT NODE 4 - This is a raw text node at the end of the fragment
          </Fragment>
        </div>
      </Fixture>
    </TestCase>
  );
}

function ObserveTextOnlyWarning() {
  const fragmentRef = useRef(null);
  const [message, setMessage] = useState('');

  const tryObserve = () => {
    setMessage('Called observeUsing() - check console for warning');
    const observer = new IntersectionObserver(() => {});
    fragmentRef.current.observeUsing(observer);
  };

  return (
    <TestCase title="observeUsing - Text Only Warning">
      <TestCase.Steps>
        <li>Open the browser console</li>
        <li>Click the observeUsing button</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        A warning should appear in the console because IntersectionObserver
        cannot observe text nodes. The warning message should indicate that
        observeUsing() was called on a FragmentInstance with only text children.
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <button onClick={tryObserve}>
            observeUsing(IntersectionObserver)
          </button>
          {message && (
            <div style={{marginTop: '10px', color: 'orange'}}>{message}</div>
          )}
        </Fixture.Controls>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff0f0',
            border: '1px solid #fcc',
          }}>
          <Fragment ref={fragmentRef}>
            This fragment contains only text. Text nodes cannot be observed.
          </Fragment>
        </div>
      </Fixture>
    </TestCase>
  );
}

export default function TextNodesCase() {
  return (
    <TestCase title="Text Node Support">
      <TestCase.ExpectedResult>
        <p>
          This section demonstrates how various FragmentInstance methods work
          with text nodes.
        </p>
        <p>
          <strong>Supported:</strong> getClientRects, compareDocumentPosition,
          scrollIntoView
        </p>
        <p>
          <strong>No-op (silent):</strong> focus, focusLast (text nodes cannot
          receive focus)
        </p>
        <p>
          <strong>Not supported (warns):</strong> observeUsing (observers cannot
          observe text nodes)
        </p>
      </TestCase.ExpectedResult>
      <GetClientRectsTextOnly />
      <GetClientRectsMixed />
      <FocusTextOnlyNoop />
      <ScrollIntoViewTextOnly />
      <ScrollIntoViewMixed />
      <ObserveTextOnlyWarning />
    </TestCase>
  );
}
