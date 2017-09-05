/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 * @flow
*/

'use strict';

/**
 * Theme contains variables shared by styles of multiple components.
 */

import hex2rgba from 'hex2rgba';

const colors = {
  lighter: '#373940', // light blue
  dark: '#282c34', // dark blue
  darker: '#20232a', // really dark blue
  brand: '#61dafb', // electric blue
  brandLight: '#bbeffd',
  text: '#1a1a1a', // very dark grey / black substitute
  subtle: '#777', // light grey for text
  divider: '#ececec', // very light grey
  note: '#ffe564', // yellow
  error: '#ff6464', // yellow
  white: '#ffffff',
  black: '#000000',
};

const fonts = {
  header: {
    fontSize: 60,
    lineHeight: '65px',
    fontWeight: 700,
  },
  small: {
    fontSize: 14,
  },
};

const SIZES = {
  xsmall: {max: 599},
  small: {min: 600, max: 739},
  medium: {min: 740, max: 979},
  large: {min: 980, max: 1279},
  xlarge: {min: 1280, max: 1339},
  xxlarge: {min: 1340},
};

type Size = $Keys<typeof SIZES>;

const media = {
  between(smallKey: Size, largeKey: Size) {
    return `@media (min-width: ${SIZES[smallKey].min}px) and (max-width: ${SIZES[largeKey].max}px)`;
  },

  greaterThan(key: Size) {
    return `@media (min-width: ${SIZES[key].min}px)`;
  },

  lessThan(key: Size) {
    return `@media (max-width: ${SIZES[key].max}px)`;
  },

  size(key: Size) {
    const size = SIZES[key];

    if (size.min == null) {
      return media.lessThan(key);
    } else if (size.max == null) {
      return media.greaterThan(key);
    } else {
      return media.between(key, key);
    }
  },
};

// Shared styles are generally better as components,
// Except when they must be used within nested CSS selectors.
// This is the case for eg markdown content.
const linkStyle = {
  backgroundColor: hex2rgba(colors.brandLight, 0.5),
  borderBottom: `1px solid ${hex2rgba(colors.black, 0.2)}`,
  color: colors.text,

  ':hover': {
    backgroundColor: colors.brandLight,
    borderBottomColor: colors.text,
  },
};
const sharedStyles = {
  link: linkStyle,
  markdown: {
    lineHeight: '25px',

    '& .gatsby-highlight': {
      marginTop: 30,
    },

    '& a:not(.anchor)': linkStyle,

    '& p': {
      marginTop: 30,
      fontSize: 18,
      lineHeight: '35px',

      '&:first-of-type': {
        marginTop: 0,
      },

      [media.lessThan('large')]: {
        fontSize: 16,
        lineHeight: '30px',
      },
    },

    '& p > code, & li > code': {
      background: hex2rgba(colors.note, 0.5),
      padding: '0 3px',
    },

    '& hr': {
      height: 1,
      marginBottom: -1,
      border: 'none',
      borderBottom: `1px solid ${colors.divider}`,
    },

    '& h1': {
      [media.size('xsmall')]: {
        fontSize: 30,
      },

      [media.between('small', 'large')]: {
        fontSize: 45,
      },

      [media.greaterThan('xlarge')]: {
        fontSize: 60,
      },
    },

    '& h2': {
      borderTop: `1px solid ${colors.divider}`,
      marginTop: 44,
      paddingTop: 40,

      [media.lessThan('large')]: {
        fontSize: 20,
      },
      [media.greaterThan('xlarge')]: {
        fontSize: 35,
      },
    },

    '& h3': {
      paddingTop: 45,

      [media.greaterThan('xlarge')]: {
        fontSize: 25,
      },
    },

    // TODO Implement a better style for blockquotes
    '& blockquote': {
      backgroundColor: colors.divider,
      padding: '0.5rem 1rem',
      borderRadius: 10,
      marginBottom: 30,

      '& p': {
        marginTop: 15,

        '&:first-of-type': {
          fontWeight: 'bold',
        },

        '&:nth-of-type(2)': {
          marginTop: 0,
        },
      },
    },
  },
};

export default {
  colors,
  fonts,
  media,
  sharedStyles,
};
