import React, {Component, Suspense, startTransition} from 'react';

import Theme, {ThemeToggleButton} from './Theme';

import './Chrome.css';

import LargeContent from './LargeContent';

export default class Chrome extends Component {
  state = {theme: 'light'};
  render() {
    const assets = this.props.assets;
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" href="favicon.ico" />
          <link rel="stylesheet" href={assets['main.css']} />
          <title>{this.props.title}</title>
        </head>
        <body className={this.state.theme}>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<b>Enable JavaScript to run this app.</b>`,
            }}
          />
          <Suspense fallback="Loading...">
            <Theme.Provider value={this.state.theme}>
              <div>
                <ThemeToggleButton
                  onChange={theme => {
                    startTransition(() => {
                      this.setState({theme});
                    });
                  }}
                />
              </div>
              {this.props.children}
            </Theme.Provider>
          </Suspense>
          <p>This should appear in the first paint.</p>
          <Suspense fallback="Loading...">
            <p>This content should not block paint.</p>
            <LargeContent />
          </Suspense>
          <script
            dangerouslySetInnerHTML={{
              __html: `assetManifest = ${JSON.stringify(assets)};`,
            }}
          />
        </body>
      </html>
    );
  }
}
