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

import Flex from 'components/Flex';
import PropTypes from 'prop-types';
import React from 'react';
import {colors, fonts} from 'theme';

const MarkdownHeader = ({path, title}) => (
  <Flex type="header" halign="space-between" valign="baseline">
    <h1
      css={{
        color: colors.dark,
        marginRight: '5%',
        marginBottom: 0,
        ...fonts.header,
      }}>
      {title}
    </h1>
    {path &&
      <a
        css={{
          color: colors.subtle,
          borderColor: colors.divider,
          transition: 'all 0.2s ease',
          transitionPropery: 'color, border-color',
          whiteSpace: 'nowrap',

          ':after': {
            display: 'block',
            content: '',
            borderTopWidth: 1,
            borderTopStyle: 'solid',
          },

          ':hover': {
            color: colors.text,
            borderColor: colors.text,
          },
        }}
        href={`https://github.com/facebook/react/tree/master/docs/${path}`}>
        Edit this page
      </a>}
  </Flex>
);

MarkdownHeader.propTypes = {
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default MarkdownHeader;
