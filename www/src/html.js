/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import React, {Component} from 'react';

let stylesStr;
if (process.env.NODE_ENV === `production`) {
  try {
    stylesStr = require(`!raw-loader!../public/styles.css`);
  } catch (e) {
    console.log(e);
  }
}

const JS_NPM_URLS = [
  '//unpkg.com/docsearch.js@2.4.1/dist/cdn/docsearch.min.js',
  '//unpkg.com/babel-standalone@6.26.0/babel.min.js',
];

export default class HTML extends Component {
  render() {
    let css;
    if (process.env.NODE_ENV === 'production') {
      css = (
        <style
          id="gatsby-inlined-css"
          dangerouslySetInnerHTML={{__html: stylesStr}}
        />
      );
    }

    const js = JS_NPM_URLS.map(url => <script key={url} src={url} />);

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="icon" href="/favicon.ico" />
          {this.props.headComponents}
          {js}
          {css}
        </head>
        <body>
          <div
            id="___gatsby"
            dangerouslySetInnerHTML={{__html: this.props.body}}
          />
          {this.props.postBodyComponents}
          <script src="https://use.typekit.net/vqa1hcx.js" />
          <script
            dangerouslySetInnerHTML={{
              __html: 'try{Typekit.load({ async: true });}catch(e){}',
            }}
          />
        </body>
      </html>
    );
  }
}
