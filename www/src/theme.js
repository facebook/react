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

// Generate a bunch of pre-defined @media queries using the ranges above.
// These queries will have human-friendly identifiers,
// eg 'media.xsmall', 'media.smallDown', 'media.mediumUp', 'media.smallToLarge'
function generateMediaQueries(ranges) {
  const mediaQueries = {};

  const keys = Object.keys(ranges);
  for (let i = 0; i < keys.length; i++) {
    const keyA = keys[i];
    const [minA, maxA] = ranges[keyA];

    if (minA && maxA) {
      mediaQueries[`${keyA}Down`] = `@media (max-width: ${maxA}px)`;
      mediaQueries[
        keyA
      ] = `@media (min-width: ${minA}px) and (max-width: ${maxA}px)`;
      mediaQueries[`${keyA}Up`] = `@media (min-width: ${minA}px)`;
    } else if (minA) {
      mediaQueries[keyA] = `@media (min-width: ${minA}px)`;
    } else if (maxA) {
      mediaQueries[keyA] = `@media (max-width: ${maxA}px)`;
    }

    for (let j = i + 1; j < keys.length; j++) {
      const keyB = keys[j];
      const [minB, maxB] = ranges[keyB];

      if (maxB) {
        mediaQueries[
          `${keyA}To${keyB.charAt(0).toUpperCase() + keyB.slice(1)}`
        ] = `@media (min-width: ${minA}px) and (max-width: ${maxB}px)`;
      }
    }
  }

  return mediaQueries;
}

const media = generateMediaQueries({
  xsmall: [null, 599],
  small: [600, 739],
  medium: [740, 979],
  large: [980, 1279],
  xlarge: [1280, 1339],
  xxlarge: [1340, null],
});

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

      [media.largeDown]: {
        fontSize: 16,
        lineHeight: '30px',
      }
    },

    '& p > code, & li > code': {
      background: hex2rgba(colors.note, 0.5),
      padding: '0 3',
    },

    '& hr': {
      height: 1,
      marginBottom: -1,
      border: 'none',
      borderBottom: `1px solid ${colors.divider}`,
    },

    '& h1': {
      [media.xsmall]: {
        fontSize: 30,
        // 30px, 700);
      },

      [media.smallToLarge]: {
        fontSize: 45,
        // 45px, 700);
      },

      [media.xlargeUp]: {
        fontSize: 60,
        // 60px, 700);
      },
    },

    '& h2': {
      borderTop: `1px solid ${colors.divider}`,
      marginTop: 44,
      paddingTop: 40,

      [media.largeDown]: {
        fontSize: 20,
        // 25px, 700);
      },
      [media.xlargeUp]: {
        fontSize: 35,
        // 40px, 700);
      },
    },

    '& h3': {
      marginTop: 45,

      [media.xlargeUp]: {
        fontSize: 25,
        // 30px, 700);
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
