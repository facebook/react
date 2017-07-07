import React from 'react';
import {Sticky} from 'react-sticky';
import Sidebar from '../Sidebar';

const StickySidebar = props => (
  <Sticky>
    {({style}) => (
      <div style={style}>
        <div className="below_nav">
          <Sidebar {...props} />
        </div>
      </div>
    )}
  </Sticky>
);

export default StickySidebar;
