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
import {colors, fonts, media} from 'theme';

const MarkdownHeader = ({title}) => (
  <Flex type="header" halign="space-between" valign="baseline">
    <h1
      css={{
        color: colors.dark,
        marginBottom: 0,
        marginTop: 40,
        ...fonts.header,

        [media.size('medium')]: {
          marginTop: 60,
        },

        [media.greaterThan('large')]: {
          marginTop: 80,
        },

        [media.greaterThan('xlarge')]: {
          textAlign: 'center',
          maxWidth: '12em',
          marginLeft: 'auto',
          marginRight: 'auto',
        },
      }}>
      {title}
    </h1>
  </Flex>
);

MarkdownHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

export default MarkdownHeader;
