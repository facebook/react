import React, { Component } from 'react';

import './Chrome.css';

export default class Chrome extends Component {
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
        <body>
          {this.props.children}
          <script dangerouslySetInnerHTML={{
            __html: `assetManifest = ${JSON.stringify(assets)};`
          }} />
          <script src={assets['main.js']} />
        </body>
      </html>
    );
  }
}
