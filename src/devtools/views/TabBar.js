// @flow

import classNames from 'classnames';
import React, { Fragment, useCallback } from 'react';
import Icon from './Icon';

import styles from './TabBar.css';

import type { IconType } from './Icon';

type TabInfo = {|
  icon: IconType,
  id: string,
  label: string,
  title?: string,
|};

export type Props = {|
  currentTab: any,
  disabled?: boolean,
  id: string,
  selectTab: (tabID: any) => void,
  size: 'large' | 'small',
  tabs: Array<TabInfo>,
|};

export default function TabBar({
  currentTab,
  disabled = false,
  id: groupName,
  selectTab,
  size,
  tabs,
}: Props) {
  if (!tabs.some(tab => tab.id === currentTab)) {
    selectTab(tabs[0].id);
  }

  const onChange = useCallback(
    ({ currentTarget }) => selectTab(currentTarget.value),
    [selectTab]
  );

  const handleKeyDown = useCallback(event => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
        event.stopPropagation();
        break;
      default:
        break;
    }
  }, []);

  const tabClassName =
    size === 'large' ? styles.TabSizeLarge : styles.TabSizeSmall;

  return (
    <Fragment>
      {tabs.map(({ icon, id, label, title }) => (
        <label
          className={classNames(
            tabClassName,
            disabled ? styles.TabDisabled : styles.Tab,
            !disabled && currentTab === id ? styles.TabCurrent : null
          )}
          key={id}
          onKeyDown={handleKeyDown}
          title={title || label}
        >
          <input
            type="radio"
            className={styles.Input}
            checked={currentTab === id}
            disabled={disabled}
            name={groupName}
            value={id}
            onChange={onChange}
          />
          <Icon
            className={`${disabled ? styles.IconDisabled : ''} ${
              size === 'large' ? styles.IconSizeLarge : styles.IconSizeSmall
            }`}
            type={icon}
          />
          <span
            className={
              size === 'large' ? styles.TabLabelLarge : styles.TabLabelSmall
            }
          >
            {label}
          </span>
        </label>
      ))}
    </Fragment>
  );
}
