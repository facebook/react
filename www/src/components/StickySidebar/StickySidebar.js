import React from 'react';
import {Sticky} from 'react-sticky';
import Sidebar from '../Sidebar';
import {media} from '../../theme';

const StickySidebar = props => (
  <Sticky>
    {({style}) => (
      <div style={style}>
        <div
          css={{
            marginTop: 60,

            [media.smallDown]: {
              marginTop: 40,
            },

            [media.mediumToLarge]: {
              marginTop: 50,
            },
          }}>
          <Sidebar {...props} />
        </div>
      </div>
    )}
  </Sticky>
);

export default StickySidebar;
