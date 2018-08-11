const React = window.React;

export default function Home() {
  return (
    <main>
      <h1>DOM Test Fixtures</h1>
      <p>
        Use this site to test browser quirks and other behavior that can not be
        captured through unit tests.
      </p>
      <section>
        <h2>Tested Browsers</h2>
        <table>
          <thead>
            <tr>
              <th>Browser</th>
              <th>Versions</th>
              <th>Why/Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chrome - Desktop</td>
              <td>49, Latest</td>
              <td>49 is the last release for Windows XP</td>
            </tr>
            <tr>
              <td>Chrome - Android</td>
              <td>Latest</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Firefox Desktop</td>
              <td>
                <a href="https://www.mozilla.org/en-US/firefox/organizations/">
                  ESR
                </a>, Latest
              </td>
              <td>
                The long term support release is used by many institutions
              </td>
            </tr>
            <tr>
              <td>Internet Explorer</td>
              <td>9, 10, 11</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Microsoft Edge</td>
              <td>14, Latest</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Safari - Desktop</td>
              <td>7, Latest</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td>Safari - iOS</td>
              <td>7, Latest</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section>
        <h2>How do I test browsers I don't have access to?</h2>
        <p>
          Getting test coverage across all of these browsers can be tricky.
          Particularly for older versions of evergreen browsers. Fortunately
          there are a handful of services that make browser testing easy:
        </p>
        <ul>
          <li>
            <a href="https://browserstack.com">BrowserStack</a>
          </li>
          <li>
            <a href="https://saucelabs.com">Sauce Labs</a>
          </li>
        </ul>
        <p>
          These services cost money, however a few maintainers have access to a
          subscription. There is no obligation to subscribe to these services;
          feel free to ping a maintainer or mention that need more testing is
          required.
        </p>
      </section>
    </main>
  );
}
