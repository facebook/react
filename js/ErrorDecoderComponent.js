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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function replaceArgs(msg, argList) {
  var argIdx = 0;
  return msg.replace(/%s/g, function () {
    var arg = argList[argIdx++];
    return arg === undefined ? '[missing argument]' : arg;
  });
}

function urlify(str) {
  var urlRegex = /(https:\/\/fb\.me\/[a-z\-]+)/g;

  var segments = str.split(urlRegex);

  for (var i = 0; i < segments.length; i++) {
    if (i % 2 === 1) {
      segments[i] = React.createElement(
        'a',
        { key: i, target: '_blank', href: segments[i] },
        segments[i]
      );
    }
  }

  return segments;
}

// ?invariant=123&args[]=foo&args[]=bar
function parseQueryString() {
  var rawQueryString = window.location.search.substring(1);
  if (!rawQueryString) {
    return null;
  }

  var code = '';
  var args = [];

  var queries = rawQueryString.split('&');
  for (var i = 0; i < queries.length; i++) {
    var query = decodeURIComponent(queries[i]);
    if (query.indexOf('invariant=') === 0) {
      code = query.slice(10);
    } else if (query.indexOf('args[]=') === 0) {
      args.push(query.slice(7));
    }
  }

  return [code, args];
}

function ErrorResult(props) {
  var code = props.code;
  var errorMsg = props.msg;

  if (!code) {
    return React.createElement(
      'p',
      null,
      'When you encounter an error, you\'ll receive a link to this page for that specific error and we\'ll show you the full error text.'
    );
  }

  return React.createElement(
    'div',
    null,
    React.createElement(
      'p',
      null,
      'The full text of the error you just encountered is:'
    ),
    React.createElement(
      'code',
      null,
      urlify(errorMsg)
    )
  );
}

var ErrorDecoder = function (_React$Component) {
  _inherits(ErrorDecoder, _React$Component);

  function ErrorDecoder() {
    _classCallCheck(this, ErrorDecoder);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = _possibleConstructorReturn(this, _React$Component.call.apply(_React$Component, [this].concat(args)));

    _this.state = {
      code: null,
      errorMsg: ''
    };
    return _this;
  }

  ErrorDecoder.prototype.componentWillMount = function componentWillMount() {
    var parseResult = parseQueryString();
    if (parseResult != null) {
      var code = parseResult[0],
          args = parseResult[1];

      if (errorMap[code]) {
        this.setState({
          code: code,
          errorMsg: replaceArgs(errorMap[code], args)
        });
      }
    }
  };

  ErrorDecoder.prototype.render = function render() {
    return React.createElement(ErrorResult, {
      code: this.state.code,
      msg: this.state.errorMsg
    });
  };

  return ErrorDecoder;
}(React.Component);

ReactDOM.render(React.createElement(ErrorDecoder, null), document.querySelector('.error-decoder-container'));