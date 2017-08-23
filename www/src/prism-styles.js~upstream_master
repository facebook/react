/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import {css} from 'glamor';
import {colors} from 'theme';

const prismColors = {
  char: '#D8DEE9',
  comment: '#999999',
  keyword: '#c5a5c5',
  lineHighlight: '#14161a',
  primitive: '#5a9bcf',
  string: '#8dc891',
  variable: '#d7deea',
  boolean: '#ff8b50',
  punctuation: '#5FB3B3',
  tag: '#fc929e',
  function: '#79b6f2',
  className: '#FAC863',
  method: '#6699CC',
  operator: '#fc929e',
};

css.global('.gatsby-highlight', {
  background: colors.dark,
  color: colors.white,
  borderRadius: 10,
  overflow: 'auto',
  tabSize: '1.5em',
});

css.global(
  `
.gatsby-highlight code[class*="gatsby-code-"],
.gatsby-highlight pre[class*="gatsby-code-"],
.gatsby-highlight pre.prism-code`,
  {
    height: 'auto !important',
    margin: '1rem',
    fontSize: 14,
    lineHeight: '20px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
);

css.global('.gatsby-highlight + .gatsby-highlight', {
  marginTop: 20,
});

css.global('.gatsby-highlight-code-line', {
  backgroundColor: prismColors.lineHighlight,
  display: 'block',
  margin: '-0.125rem calc(-1rem - 15px)',
  padding: '0.125rem calc(1rem + 15px)',
});

css.global('.token.attr-name', {
  color: prismColors.keyword,
});

css.global(
  `
.token.comment,
.token.block-comment,
.token.prolog,
.token.doctype,
.token.cdata`,
  {
    color: prismColors.comment,
  },
);

css.global(
  `
.token.property,
.token.number,
.token.function-name,
.token.constant,
.token.symbol,
.token.deleted`,
  {
    color: prismColors.primitive,
  },
);

css.global(`.token.boolean`, {
  color: prismColors.boolean,
});

css.global(`.token.tag`, {
  color: prismColors.tag,
});

css.global(`.token.string`, {
  color: prismColors.string,
});

css.global(`.token.punctuation`, {
  color: prismColors.punctuation,
});

css.global(
  `
.token.selector,
.token.char,
.token.builtin,
.token.inserted`,
  {
    color: prismColors.char,
  },
);

css.global(`.token.function`, {
  color: prismColors.function,
});

css.global(
  `
.token.operator,
.token.entity,
.token.url,
.token.variable`,
  {
    color: prismColors.variable,
  },
);

css.global('.token.attr-value', {
  color: prismColors.string,
});

css.global('.token.keyword', {
  color: prismColors.keyword,
});

css.global(
  `
.token.atrule,
.token.class-name`,
  {
    color: prismColors.className,
  },
);

css.global('.token.important', {
  fontWeight: 400,
});

css.global('.token.bold', {
  fontWeight: 700,
});
css.global('.token.italic', {
  fontStyle: 'italic',
});

css.global('.token.entity', {
  cursor: 'help',
});

css.global('.namespace', {
  opacity: 0.7,
});
