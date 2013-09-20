/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global exports:true*/
"use strict";
var append = require('jstransform/src/utils').append;
var catchup = require('jstransform/src/utils').catchup;
var move = require('jstransform/src/utils').move;
var Syntax = require('esprima-fb').Syntax;

var knownTags = {
  a: true,
  abbr: true,
  address: true,
  applet: true,
  area: true,
  article: true,
  aside: true,
  audio: true,
  b: true,
  base: true,
  bdi: true,
  bdo: true,
  big: true,
  blockquote: true,
  body: true,
  br: true,
  button: true,
  canvas: true,
  caption: true,
  circle: true,
  cite: true,
  code: true,
  col: true,
  colgroup: true,
  command: true,
  data: true,
  datalist: true,
  dd: true,
  del: true,
  details: true,
  dfn: true,
  dialog: true,
  div: true,
  dl: true,
  dt: true,
  ellipse: true,
  em: true,
  embed: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  footer: true,
  form: true,
  g: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  head: true,
  header: true,
  hgroup: true,
  hr: true,
  html: true,
  i: true,
  iframe: true,
  img: true,
  input: true,
  ins: true,
  kbd: true,
  keygen: true,
  label: true,
  legend: true,
  li: true,
  line: true,
  link: true,
  main: true,
  map: true,
  mark: true,
  marquee: true,
  menu: true,
  menuitem: true,
  meta: true,
  meter: true,
  nav: true,
  noscript: true,
  object: true,
  ol: true,
  optgroup: true,
  option: true,
  output: true,
  p: true,
  param: true,
  path: true,
  polyline: true,
  pre: true,
  progress: true,
  q: true,
  rect: true,
  rp: true,
  rt: true,
  ruby: true,
  s: true,
  samp: true,
  script: true,
  section: true,
  select: true,
  small: true,
  source: true,
  span: true,
  strong: true,
  style: true,
  sub: true,
  summary: true,
  sup: true,
  svg: true,
  table: true,
  tbody: true,
  td: true,
  text: true,
  textarea: true,
  tfoot: true,
  th: true,
  thead: true,
  time: true,
  title: true,
  tr: true,
  track: true,
  u: true,
  ul: true,
  'var': true,
  video: true,
  wbr: true
};

function safeTrim(string) {
  return string.replace(/^[ \t]+/, '').replace(/[ \t]+$/, '');
}

// Replace all trailing whitespace characters with a single space character
function trimWithSingleSpace(string) {
  return string.replace(/^[ \t\xA0]{2,}/, ' ').
    replace(/[ \t\xA0]{2,}$/, ' ').replace(/^\s+$/, '');
}

/**
 * Special handling for multiline string literals
 * print lines:
 *
 *   line
 *   line
 *
 * as:
 *
 *   "line "+
 *   "line"
 */
function renderXJSLiteral(object, isLast, state, start, end) {
  /** Added blank check filtering and triming*/
  var trimmedChildValue = safeTrim(object.value);
  var hasFinalNewLine = false;

  if (trimmedChildValue) {
    // head whitespace
    append(object.value.match(/^[\t ]*/)[0], state);
    if (start) {
      append(start, state);
    }

    var trimmedChildValueWithSpace = trimWithSingleSpace(object.value);

    /**
     */
    var initialLines = trimmedChildValue.split(/\r\n|\n|\r/);

    var lines = initialLines.filter(function(line) {
      return safeTrim(line).length > 0;
    });

    var hasInitialNewLine = initialLines[0] !== lines[0];
    hasFinalNewLine =
      initialLines[initialLines.length - 1] !== lines[lines.length - 1];

    var numLines = lines.length;
    lines.forEach(function (line, ii) {
      var lastLine = ii === numLines - 1;
      var trimmedLine = safeTrim(line);
      if (trimmedLine === '' && !lastLine) {
        append(line, state);
      } else {
        var preString = '';
        var postString = '';
        var leading = line.match(/^[ \t]*/)[0];

        if (ii === 0) {
          if (hasInitialNewLine) {
            preString = ' ';
            leading = '\n' + leading;
          }
          if (trimmedChildValueWithSpace.substring(0, 1) === ' ') {
            // If this is the first line, and the original content starts with
            // whitespace, place a single space at the beginning.
            preString = ' ';
          }
        }
        if (!lastLine || trimmedChildValueWithSpace.substr(
             trimmedChildValueWithSpace.length - 1, 1) === ' ' ||
             hasFinalNewLine
             ) {
          // If either not on the last line, or the original content ends with
          // whitespace, place a single character at the end.
          postString = ' ';
        }

        append(
          leading +
          JSON.stringify(
            preString + trimmedLine + postString
          ) +
          (lastLine ? '' : '+') +
          line.match(/[ \t]*$/)[0],
          state);
      }
      if (!lastLine) {
        append('\n', state);
      }
    });
  } else {
    if (start) {
      append(start, state);
    }
    append('""', state);
  }
  if (end) {
    append(end, state);
  }

  // add comma before trailing whitespace
  if (!isLast) {
    append(',', state);
  }

  // tail whitespace
  if (hasFinalNewLine) {
    append('\n', state);
  }
  append(object.value.match(/[ \t]*$/)[0], state);
  move(object.range[1], state);
}

function renderXJSExpressionContainer(traverse, object, isLast, path, state) {
  // Plus 1 to skip `{`.
  move(object.range[0] + 1, state);
  traverse(object.expression, path, state);
  if (!isLast && object.expression.type !== Syntax.XJSEmptyExpression) {
    // If we need to append a comma, make sure to do so after the expression.
    catchup(object.expression.range[1], state);
    append(',', state);
  }

  // Minus 1 to skip `}`.
  catchup(object.range[1] - 1, state);
  move(object.range[1], state);
  return false;
}

function quoteAttrName(attr) {
  // Quote invalid JS identifiers.
  if (!/^[a-z_$][a-z\d_$]*$/i.test(attr)) {
    return "'" + attr + "'";
  }
  return attr;
}

exports.knownTags = knownTags;
exports.renderXJSExpressionContainer = renderXJSExpressionContainer;
exports.renderXJSLiteral = renderXJSLiteral;
exports.quoteAttrName = quoteAttrName;
