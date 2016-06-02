/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* global React ReactDOM errorMap:true */
'use strict';

function replaceArgs(msg, argList) {
  let argIdx = 0;
  return msg.replace(/%s/g, function() {
    const arg = argList[argIdx++];
    return arg === undefined ? '[missing argument]' : arg;
  });
}

function segmentify(str) {
  const urlRegex = /(https:\/\/fb\.me\/[a-z\-]+)/g;
  const matchResult = str.match(urlRegex);
  if (!matchResult) {
    return str;
  }

  const segments = str.split(urlRegex);

  for (let i = 0; i < segments.length; i++) {
    const matchIdx = matchResult.indexOf(segments[i]);
    if (matchIdx !== -1) {
      const url = matchResult[matchIdx];
      segments[i] = (<a key={i} target="_blank" href={url}>{url}</a>);
    }
  }

  return segments;
}

// ?invariant=123&args="foo"&args="bar"&stack="longlonginfo"
function parseQueryString() {
  const rawQueryString = window.location.search.substring(1);
  if (!rawQueryString) {
    return null;
  }

  let code = '';
  let args = [];
  let stack = '';

  const queries = decodeURIComponent(rawQueryString).split('&');
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (query.indexOf('invariant=') === 0) {
      code = query.slice(10);
    } else if (query.indexOf('args=') === 0) {
      args.push(query.slice(5));
    } else if (query.indexOf('stack=') === 0) {
      stack = query.slice(6);
    }
  }

  const stripQuotesRegex = /^\ *\"([\s\S]*)\"\ *$/;
  // remove double quotes
  args = args.map((str) => str.replace(stripQuotesRegex, '$1'));
  stack = stack.replace(stripQuotesRegex, '$1');

  return [code, args, stack];
}

function ErrorResult(props) {
  const code = props.code;
  const errorMsg = props.msg;
  const stack = props.stack;

  if (!code) {
    return (
      <p>
        No valid query params provided in the URL. Here's an example: {' '}
        <a href="/react/docs/error-codes.html?invariant=50&args=%22Foobar%22">
          http://facebook.github.io/react/docs/error-codes.html?invariant=50&args="Foobar"
        </a>
      </p>
    );
  }

  return (
    <div>
      <h4>Error #{code}</h4>
      <code>{segmentify(errorMsg)}</code>
      {stack ? <h4>Stack Info</h4> : <h4>Stack info not found.</h4>}
      <pre>{stack}</pre>
    </div>
  );
}

class ErrorCodes extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      code: null,
      errorMsg: '',
      stack: '',
    };
  }

  componentWillMount() {
    const parseResult = parseQueryString();
    if (parseResult != null) {
      const [code, args, stack] = parseResult;
      if (errorMap[code]) {
        this.setState({
          code: code,
          errorMsg: replaceArgs(errorMap[code], args),
          stack: stack,
        });
      }
    }
  }

  render() {
    return (
      <ErrorResult
        code={this.state.code}
        msg={this.state.errorMsg}
        stack={this.state.stack}
      />
    );
  }
}

ReactDOM.render(
  <ErrorCodes />,
  document.querySelector('.error-codes-container')
);
