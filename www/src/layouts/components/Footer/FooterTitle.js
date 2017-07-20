import React from 'react';
import {colors} from 'theme';

const FooterTitle = ({children, title}) => (
  <div
    css={{
      color: colors.subtle,
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 3,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }}>
    {children}
  </div>
);

export default FooterTitle;
