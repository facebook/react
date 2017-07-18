import React from 'react';
import {Sticky} from 'react-sticky';
import Sidebar from '../Sidebar';
import styles from './StickySidebar.module.scss';

const StickySidebar = props => (
  <Sticky>
    {({style}) => (
      <div style={style}>
        <div className={styles.StickySidebar}>
          <Sidebar {...props} />
        </div>
      </div>
    )}
  </Sticky>
);

export default StickySidebar;
