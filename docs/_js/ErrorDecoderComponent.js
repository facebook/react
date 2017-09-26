/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

function urlify(str) {
  const urlRegex = /(https:\/\/fb\.me\/[a-z\-]+)/g;

  const segments = str.split(urlRegex);

  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 1) {
      segments[i] = (<a key={i} target="_blank" href={segments[i]}>{segments[i]}</a>);
    }
  }

  return segments;
}

// ?invariant=123&args[]=foo&args[]=bar
function parseQueryString() {
  const rawQueryString = window.location.search.substring(1);
  if (!rawQueryString) {
    return null;
  }

  let code = '';
  let args = [];

  const queries = rawQueryString.split('&');
  for (let i = 0; i < queries.length; i++) {
    const query = decodeURIComponent(queries[i]);
    if (query.indexOf('invariant=') === 0) {
      code = query.slice(10);
    } else if (query.indexOf('args[]=') === 0) {
      args.push(query.slice(7));
    }
  }

  return [code, args];
}

function ErrorResult(props) {
  const code = props.code;
  const errorMsg = props.msg;

  if (!code) {
    return (
      <p>When you encounter an error, you'll receive a link to this page for that specific error and we'll show you the full error text.</p>
    );
  }

  return (
    <div>
      <p>The full text of the error you just encountered is:</p>
      <code>{urlify(errorMsg)}</code>
    </div>
  );
}

class ErrorDecoder extends React.Component {
  constructor(...args) {
    super(...args);

    this.state = {
      code: null,
      errorMsg: '',
    };
  }

  componentWillMount() {
    const parseResult = parseQueryString();
    if (parseResult != null) {
      const [code, args] = parseResult;
      if (errorMap[code]) {
        this.setState({
          code: code,
          errorMsg: replaceArgs(errorMap[code], args),
        });
      }
    }
  }

  render() {
    return (
      <ErrorResult
        code={this.state.code}
        msg={this.state.errorMsg}
      />
    );
  }
}

ReactDOM.render(
  <ErrorDecoder />,
  document.querySelector('.error-decoder-container')
);
