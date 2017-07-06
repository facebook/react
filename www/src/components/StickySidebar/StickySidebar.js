import React from 'react';
import {Sticky} from 'react-sticky';
import Sidebar from '../Sidebar';

const StickySidebar = props => (
  <Sticky>
    {({style}) => (
      <div
        className="below_nav"
        style={{
          ...style,
          width: 'auto',
        }}>

        <Sidebar {...props} />
      </div>
    )}
  </Sticky>
);

export default StickySidebar;
