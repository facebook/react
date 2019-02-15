// @flow

import React, { useCallback } from 'react';
import Icon from './Icon';
import ReactLogo from './ReactLogo';

import styles from './TabBar.css';

import type { TabID } from './DevTools';

export type Props = {|
  currentTab: TabID,
  selectTab: (tabID: TabID) => void,
|};

export default function TabBar({ currentTab, selectTab }: Props) {
  const onChange = useCallback(
    ({ currentTarget }) => selectTab(currentTarget.value),
    [selectTab]
  );

  return (
    <div className={styles.TabBar}>
      <ReactLogo />
      <span className={styles.DevToolsVersion}>
        {process.env.DEVTOOLS_VERSION}
      </span>
      <div className={styles.Tabs}>
        <label
          className={currentTab === 'elements' ? styles.TabCurrent : styles.Tab}
          title="React Elements"
        >
          <input
            type="radio"
            name="TabBar-tab"
            className={styles.Input}
            checked={currentTab === 'elements'}
            value="elements"
            onChange={onChange}
          />
          <Icon className={styles.Icon} type="elements" />
          <span className={styles.TabLabel}>Elements</span>
        </label>
        <label
          className={currentTab === 'profiler' ? styles.TabCurrent : styles.Tab}
          title="React Profiler"
        >
          <input
            type="radio"
            name="TabBar-tab"
            className={styles.Input}
            checked={currentTab === 'profiler'}
            value="profiler"
            onChange={onChange}
          />
          <Icon className={styles.Icon} type="profiler" />
          <span className={styles.TabLabel}>Profiler</span>
        </label>
        <label
          className={currentTab === 'settings' ? styles.TabCurrent : styles.Tab}
          title="React Settings"
        >
          <input
            type="radio"
            name="TabBar-tab"
            className={styles.Input}
            checked={currentTab === 'settings'}
            value="settings"
            onChange={onChange}
          />
          <Icon className={styles.Icon} type="settings" />
          <span className={styles.TabLabel}>Settings</span>
        </label>
      </div>
    </div>
  );
}
