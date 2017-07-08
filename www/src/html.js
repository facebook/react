import React from 'react';
import Helmet from 'react-helmet';
import Typekit from 'react-typekit';
import GridHelper from './components/GridHelper';

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
    const head = Helmet.rewind();

    let css;
    if (process.env.NODE_ENV === `production`) {
      css = <style id="gatsby-inlined-css" dangerouslySetInnerHTML={{ __html: stylesStr }} />;
    }

    let gridHelper;
    if (process.env.NODE_ENV !== `production`) {
      gridHelper = <GridHelper />;
    }

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {this.props.headComponents}
          {css}
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <Typekit kitId="xnt6blw" />
          <script src="https://unpkg.com/babel-standalone@6.15.0/babel.min.js" />
        </head>
        <body>
          <div id="___gatsby" dangerouslySetInnerHTML={{ __html: this.props.body }} />
          {this.props.postBodyComponents}
          {gridHelper}
        </body>
      </html>
    );
  }
}
