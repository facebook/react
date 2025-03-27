import TestCase from '../../TestCase';
import Fixture from '../../Fixture';

const React = window.React;
const {Fragment, useRef, useState} = React;

function Controls({
  alignToTop,
  setAlignToTop,
  scrollVertical,
  scrollVerticalNoChildren,
}) {
  return (
    <div>
      <label>
        Align to Top:
        <input
          type="checkbox"
          checked={alignToTop}
          onChange={e => setAlignToTop(e.target.checked)}
        />
      </label>
      <div>
        <button onClick={scrollVertical}>scrollIntoView() - Vertical</button>
        <button onClick={scrollVerticalNoChildren}>
          scrollIntoView() - Vertical, No children
        </button>
      </div>
    </div>
  );
}

function TargetElement({color, top, id}) {
  return (
    <div
      id={id}
      style={{
        height: 500,
        backgroundColor: color,
        marginTop: top ? '50vh' : 0,
        marginBottom: 100,
        flexShrink: 0,
      }}>
      {id}
    </div>
  );
}

export default function ScrollIntoViewCase() {
  const [alignToTop, setAlignToTop] = useState(true);
  const verticalRef = useRef(null);
  const noChildRef = useRef(null);

  const scrollVertical = () => {
    verticalRef.current.scrollIntoView(alignToTop);
  };

  const scrollVerticalNoChildren = () => {
    noChildRef.current.scrollIntoView(alignToTop);
  };

  return (
    <TestCase title="ScrollIntoView">
      <TestCase.Steps>
        <li>Toggle alignToTop and click the buttons to scroll</li>
      </TestCase.Steps>
      <TestCase.ExpectedResult>
        <p>When the Fragment has children:</p>
        <p>
          The simple path is that all children are in the same scroll container.
          If alignToTop=true|undefined, we will select the first Fragment host
          child to call scrollIntoView on. Otherwise we'll call on the last host
          child.
        </p>
        <p>
          In the case of fixed or sticky elements and portals (we have here
          sticky header and footer), we split up the host children into groups
          of scroll containers. If we hit a sticky/fixed element, we'll always
          attempt to scroll on the first or last element of the next group.
        </p>
        <p>When the Fragment does not have children:</p>
        <p>
          The Fragment still represents a virtual space. We can scroll to the
          nearest edge by selecting the host sibling before if alignToTop=false,
          or after if alignToTop=true|undefined. We'll fall back to the other
          sibling or parent in the case that the preferred sibling target
          doesn't exist.
        </p>
      </TestCase.ExpectedResult>
      <Fixture>
        <Fixture.Controls>
          <Controls
            alignToTop={alignToTop}
            setAlignToTop={setAlignToTop}
            scrollVertical={scrollVertical}
            scrollVerticalNoChildren={scrollVerticalNoChildren}
          />
        </Fixture.Controls>
        <Fragment ref={verticalRef}>
          <div
            style={{position: 'sticky', top: 100, backgroundColor: 'red'}}
            id="header">
            Sticky header
          </div>
          <TargetElement color="lightgreen" top={true} id="A" />
          <Fragment ref={noChildRef}></Fragment>
          <TargetElement color="lightcoral" id="B" />
          <TargetElement color="lightblue" id="C" />
          <div
            style={{position: 'sticky', bottom: 0, backgroundColor: 'purple'}}
            id="footer">
            Sticky footer
          </div>
        </Fragment>

        <Fixture.Controls>
          <Controls
            alignToTop={alignToTop}
            setAlignToTop={setAlignToTop}
            scrollVertical={scrollVertical}
            scrollVerticalNoChildren={scrollVerticalNoChildren}
          />
        </Fixture.Controls>
      </Fixture>
    </TestCase>
  );
}
