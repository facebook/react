import React, {Component} from 'react';
import ReactDOM from 'react-dom';

// Helps to test hydration edge cases with the root node.
// Sets the passed-in `serverHTML` as `innerHTML` and hydrates the passed-in `browserReact` over it.
class SSRMismatchTestRootHydrate extends Component {
  componentDidMount() {
    if (this._el) {
      this._el.innerHTML = this.props.serverHTML;
      ReactDOM.hydrate(this.props.browserReact, this._el);
    }
  }

  render() {
    return (
      <div
        data-ssr-mismatch-test-hydrate-root
        ref={el => {
          this._el = el;
        }}
      />
    );
  }
}

const testCases = [
  {
    key: 'ssr-warnForTextDifference',
    renderServer: () => (
      <div>
        <em>SSRMismatchTest server text</em>
      </div>
    ),
    renderBrowser: () => (
      // The inner element type is the same as the server render, but the inner text differs.
      <div>
        <em>SSRMismatchTest client text</em>
      </div>
    ),
  },
  {
    key:
      'ssr-warnForTextDifference-warnForUnmatchedText-didNotMatchHydratedContainerTextInstance',
    render: () => (
      <SSRMismatchTestRootHydrate
        serverHTML={'SSRMismatchTest server text'}
        browserReact={'SSRMismatchTest client text'}
      />
    ),
  },
  {
    key:
      'ssr-warnForTextDifference-warnForUnmatchedText-didNotMatchHydratedTextInstance',
    renderServer: () => (
      <div>
        <em>
          {'SSRMismatchTest static text and '}
          {'server random text ' + Math.random()}
        </em>
      </div>
    ),
    renderBrowser: () => (
      <div>
        <em>
          {'SSRMismatchTest static text and '}
          {'client random text ' + Math.random()}
        </em>
      </div>
    ),
  },
  {
    key: 'ssr-warnForPropDifference',
    renderServer: () => (
      <div>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
    renderBrowser: () => (
      // The inner element type is the same as the server render.
      // The browser root element has an extra prop with a non-`null` value.
      <div data-ssr-extra-prop={true} data-ssr-extra-prop-2={true}>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
  },
  {
    key: 'ssr-warnForPropDifference-null-no-warning',
    renderServer: () => (
      <div>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
    renderBrowser: () => (
      // The inner element type is the same as the server render.
      // The browser root element has an extra prop explicitly set to `null`.
      <div data-ssr-extra-prop={null} data-ssr-extra-prop-2={null}>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
  },
  {
    key: 'ssr-warnForExtraAttributes',
    renderServer: () => (
      <div data-ssr-extra-prop={true} data-ssr-extra-prop-2={true}>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
    renderBrowser: () => (
      // The inner element type is the same as the server render.
      // The root element is missing a server-rendered prop.
      <div>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
  },
  {
    key: 'ssr-warnForInvalidEventListener-false',
    renderServer: () => <div onClick={() => {}} />,
    renderBrowser: () => <div onClick={false} />,
  },
  {
    key: 'ssr-warnForInvalidEventListener-typeof',
    renderServer: () => <div onClick={() => {}} />,
    renderBrowser: () => <div onClick={'a string'} />,
  },
  {
    key: 'ssr-warnForDeletedHydratableElement-didNotHydrateContainerInstance',
    render: () => (
      <SSRMismatchTestRootHydrate
        serverHTML={
          'SSRMismatchTest first text' +
          '<br />' +
          '<br />' +
          'SSRMismatchTest second text'
        }
        browserReact={[
          'SSRMismatchTest first text',
          <br key={1} />,
          'SSRMismatchTest second text',
        ]}
      />
    ),
  },
  {
    key: 'ssr-warnForDeletedHydratableElement-didNotHydrateInstance',
    renderServer: () => (
      <div>
        <div />
        <span />
      </div>
    ),
    renderBrowser: () => (
      <div>
        <span />
      </div>
    ),
  },
  {
    key: 'ssr-warnForDeletedHydratableText-didNotHydrateContainerInstance',
    render: () => (
      <SSRMismatchTestRootHydrate
        serverHTML={
          'SSRMismatchTest server text' +
          '<br />' +
          'SSRMismatchTest default text'
        }
        browserReact={[<br key={1} />, 'SSRMismatchTest default text']}
      />
    ),
  },
  {
    key: 'ssr-warnForDeletedHydratableText-didNotHydrateInstance',
    renderServer: () => (
      <div>
        SSRMismatchTest server text
        <span />
      </div>
    ),
    renderBrowser: () => (
      <div>
        <span />
      </div>
    ),
  },
  {
    key:
      'ssr-warnForInsertedHydratedElement-didNotFindHydratableContainerInstance',
    render: () => (
      // The root element type is different (text on server, span on client), the inner text is the same.
      <SSRMismatchTestRootHydrate
        serverHTML={'SSRMismatchTest default text'}
        browserReact={<span>SSRMismatchTest default text</span>}
      />
    ),
  },
  {
    key: 'ssr-warnForInsertedHydratedElement-didNotFindHydratableInstance',
    renderServer: () => (
      <div>
        <em>SSRMismatchTest default text</em>
      </div>
    ),
    renderBrowser: () => (
      // The inner element type is different from the server render, but the inner text is the same.
      <div>
        <p>SSRMismatchTest default text</p>
      </div>
    ),
  },
  {
    key:
      'ssr-warnForInsertedHydratedText-didNotFindHydratableContainerTextInstance',
    render: () => (
      // The root element type is different (span on server, text on client), the inner text is the same.
      <SSRMismatchTestRootHydrate
        serverHTML={'<span>SSRMismatchTest default text</span>'}
        browserReact={'SSRMismatchTest default text'}
      />
    ),
  },
  {
    key: 'ssr-warnForInsertedHydratedText-didNotFindHydratableTextInstance',
    renderServer: () => (
      <div>
        <span />
        <span />
      </div>
    ),
    renderBrowser: () => (
      <div>
        <span />
        SSRMismatchTest client text
        <span />
      </div>
    ),
  },
];

// Triggers the DOM mismatch warnings if requested via query string.
export default class SSRMismatchTest extends Component {
  render() {
    let content = null;
    const queryParams = this.props.url.replace(/^[^?]+[?]?/, '').split('&');
    const testCaseFound = testCases.find(
      testCase => queryParams.indexOf(testCase.key) >= 0
    );
    if (testCaseFound) {
      // In the browser where `window` is available, triggering a DOM mismatch if it's requested.
      let render;
      if (typeof window !== 'undefined') {
        render = testCaseFound.renderBrowser || testCaseFound.render;
      } else {
        render = testCaseFound.renderServer || testCaseFound.render;
      }
      content = render();
    }

    return (
      <div>
        <div style={{fontSize: '12px'}}>
          <div>SSRMismatchTest. Open the console, select a test case:</div>
          <ol>
            <li style={{paddingBottom: '10px'}}>
              <a href="/">none</a>
            </li>
            {testCases.map(testCase => (
              <li key={testCase.key} style={{paddingBottom: '10px'}}>
                <a href={'/?' + testCase.key}>{testCase.key}</a>
                {testCaseFound && testCaseFound.key === testCase.key
                  ? ' 👈'
                  : ' '}
              </li>
            ))}
          </ol>
        </div>
        {content}
      </div>
    );
  }
}
