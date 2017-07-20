import React from 'react';
import {colors} from 'theme';

const FooterLink = ({children, to}) => (
  <a
    css={{
      fontWeight: 300,
      lineHeight: 2,
      ':hover': {
        color: colors.brand,
      },
    }}
    href={to}>
    {children}
  </a>
);

export default FooterLink;
