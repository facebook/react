import React, {useState, useDeferredValue} from 'react';

import Theme, {ThemeToggleButton} from './Theme';

import './Chrome.css';

export default function Chrome(props) {
  const [nextTheme, setNextTheme] = useState('light');
  const theme = useDeferredValue(nextTheme, {timeoutMs: 6000});

  const assets = props.assets;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href="favicon.ico" />
        <link rel="stylesheet" href={assets['main.css']} />
        <title>{props.title}</title>
      </head>
      <body className={theme}>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<b>Enable JavaScript to run this app.</b>`,
          }}
        />
        <Theme.Provider value={theme}>
          {props.children}
          <div>
            <ThemeToggleButton onChange={t => setTheme(t)} />
          </div>
        </Theme.Provider>
        <script
          dangerouslySetInnerHTML={{
            __html: `assetManifest = ${JSON.stringify(assets)};`,
          }}
        />
        <script src={assets['main.js']} />
      </body>
    </html>
  );
}
