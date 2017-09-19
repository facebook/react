/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import {css} from 'glamor';
import {colors} from 'theme';

const prismColors = {
  char: '#61dafb',
  comment: '#999999',
  keyword: '#c4f1fe',
  lineHighlight: '#393d45',
  primative: '#c997c0',
  string: '#99c27c',
  variable: '#99c27c',
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
  margin: '-0.125rem -1rem',
  padding: '0.125rem 1rem',
});

css.global('.token.attr-name', {
  color: colors.white,
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
.token.boolean,
.token.number,
.token.function-name,
.token.constant,
.token.symbol,
.token.deleted`,
  {
    color: prismColors.primative,
  },
);

css.global(
  `
.token.punctuation,
.token.tag,
.token.string`,
  {
    color: prismColors.string,
  },
);

css.global(
  `
.token.selector,
.token.char,
.token.function,
.token.builtin,
.token.inserted`,
  {
    color: prismColors.char,
  },
);

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
  color: prismColors.comment,
});

css.global('.token.keyword', {
  color: prismColors.keyword,
});

css.global(
  `
.token.atrule,
.token.class-name`,
  {
    color: prismColors.char,
  },
);

css.global('.token.important', {
  fontWeight: 'normal',
});

css.global('.token.bold', {
  fontWeight: 'bold',
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
