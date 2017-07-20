import React from 'react';
import {media} from 'theme';

const FooterNav = ({children, title}) => (
  <div
    css={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '50%',
      [media.mediumToLarge]: {
        width: '25%',
      },
      [media.xlargeUp]: {
        width: 'calc(100% / 6)',
      },
    }}>
    <div
      css={{
        display: 'inline-flex',
        flexDirection: 'column',
      }}>
      {children}
    </div>
  </div>
);

export default FooterNav;
