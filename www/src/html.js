import React from 'react';
import Typekit from 'react-typekit';

let stylesStr;
if (process.env.NODE_ENV === `production`) {
  try {
    stylesStr = require(`!raw-loader!../public/styles.css`);
  } catch (e) {
    console.log(e);
  }
}

export default class HTML extends React.Component {
  render() {
    let css;
    if (process.env.NODE_ENV === `production`) {
      css = (
        <style
          id="gatsby-inlined-css"
          dangerouslySetInnerHTML={{__html: stylesStr}}
        />
      );
    }

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          {this.props.headComponents}
          {css}
          <Typekit kitId="xnt6blw" />
          <script src="https://unpkg.com/babel-standalone@6.15.0/babel.min.js" />
        </head>
        <body>
          <div
            id="___gatsby"
            dangerouslySetInnerHTML={{__html: this.props.body}}
          />
          {this.props.postBodyComponents}
        </body>
      </html>
    );
  }
}
