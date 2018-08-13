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
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chrome - Desktop</td>
              <td>
                49<sup>*</sup>, Latest
              </td>
            </tr>
            <tr>
              <td>Chrome - Android</td>
              <td>Latest</td>
            </tr>
            <tr>
              <td>Firefox Desktop</td>
              <td>
                <a href="https://www.mozilla.org/en-US/firefox/organizations/">
                  ESR<sup>†</sup>
                </a>, Latest
              </td>
            </tr>
            <tr>
              <td>Internet Explorer</td>
              <td>9, 10, 11</td>
            </tr>
            <tr>
              <td>Microsoft Edge</td>
              <td>14, Latest</td>
            </tr>
            <tr>
              <td>Safari - Desktop</td>
              <td>7, Latest</td>
            </tr>
            <tr>
              <td>Safari - iOS</td>
              <td>7, Latest</td>
            </tr>
          </tbody>
        </table>
        <footer>
          <small>* Chrome 49 is the last release for Windows XP.</small>
          <br />
          <small>
            † Firefox Extended Support Release (ESR) is used by many
            institutions.
          </small>
        </footer>
      </section>
      <section>
        <h2>How do I test browsers I don't have access to?</h2>
        <p>
          Getting test coverage across all of these browsers can be difficult,
          particularly for older versions of evergreen browsers. Fortunately
          there are a handful of tools that make browser testing easy.
        </p>
        <section>
          <h3>Paid services</h3>
          <ul>
            <li>
              <a href="https://browserstack.com">BrowserStack</a>
            </li>
            <li>
              <a href="https://saucelabs.com">Sauce Labs</a>
            </li>
            <li>
              <a href="https://crossbrowsertesting.com/">CrossBrowserTesting</a>
            </li>
          </ul>
          <p>
            These services provide access to all browsers we test, however they
            cost money. There is no obligation to pay for them. Maintainers have
            access to a BrowserStack subscription; feel free to contact a
            maintainer or mention browsers where extra testing is required.
          </p>
        </section>
        <section>
          <h3>Browser downloads</h3>
          <p>A handful of browsers are available for download directly:</p>
          <ul>
            <li>
              <a href="https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/">
                Internet Explorer (9-11) and MS Edge virtual machines
              </a>
            </li>
            <li>
              <a href="https://www.chromium.org/getting-involved/download-chromium#TOC-Downloading-old-builds-of-Chrome-Chromium">
                Chromium snapshots (for older versions of Chrome)
              </a>
            </li>
            <li>
              <a href="https://www.mozilla.org/en-US/firefox/organizations/">
                Firefox Extended Support Release (ESR)
              </a>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
