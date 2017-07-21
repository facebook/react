import Link from 'gatsby-link';
import {colors, media} from 'theme';

const ButtonLink = ({children, type, ...rest}) => {
  let typeStyle;
  switch (type) {
    case 'primary':
      typeStyle = primaryStyle;
      break;
    case 'secondary':
      typeStyle = secondaryStyle;
      break;
  }

  return (
    <Link {...rest} css={[style, typeStyle]}>
      {children}
    </Link>
  );
};

const style = {
  display: 'inline-block',
};

const primaryStyle = {
  backgroundColor: colors.brand,
  color: colors.black,
  fontWeight: 100,
  padding: '10px 25px',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.2s ease-out',

  [media.xlargeUp]: {
    paddingTop: 15,
    paddingBottom: 15,
  },

  ':hover': {
    backgroundColor: colors.white,
  },
};

const secondaryStyle = {
  color: colors.brand,
  transition: 'color 0.2s ease-out',

  ':hover': {
    color: colors.white,
  },
};

export default ButtonLink;
