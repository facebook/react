/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useCallback} from 'react';
import Tooltip from '@reach/tooltip';
import Icon from './Icon';

import styles from './TabBar.css';
import tooltipStyles from './Tooltip.css';

import type {IconType} from './Icon';

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
  tabs: Array<TabInfo>,
  type: 'navigation' | 'profiler' | 'settings',
|};

export default function TabBar({
  currentTab,
  disabled = false,
  id: groupName,
  selectTab,
  tabs,
  type,
}: Props) {
  if (!tabs.some(tab => tab.id === currentTab)) {
    selectTab(tabs[0].id);
  }

  const onChange = useCallback(
    ({currentTarget}) => selectTab(currentTarget.value),
    [selectTab],
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

  let iconSizeClassName;
  let tabLabelClassName;
  let tabSizeClassName;
  switch (type) {
    case 'navigation':
      iconSizeClassName = styles.IconSizeNavigation;
      tabLabelClassName = styles.TabLabelNavigation;
      tabSizeClassName = styles.TabSizeNavigation;
      break;
    case 'profiler':
      iconSizeClassName = styles.IconSizeProfiler;
      tabLabelClassName = styles.TabLabelProfiler;
      tabSizeClassName = styles.TabSizeProfiler;
      break;
    case 'settings':
      iconSizeClassName = styles.IconSizeSettings;
      tabLabelClassName = styles.TabLabelSettings;
      tabSizeClassName = styles.TabSizeSettings;
      break;
    default:
      throw Error(`Unsupported type "${type}"`);
  }

  return (
    <Fragment>
      {tabs.map(({icon, id, label, title}) => {
        let button = (
          <label
            className={[
              tabSizeClassName,
              disabled ? styles.TabDisabled : styles.Tab,
              !disabled && currentTab === id ? styles.TabCurrent : '',
            ].join(' ')}
            key={id}
            onKeyDown={handleKeyDown}
            onMouseDown={() => selectTab(id)}>
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
              className={`${
                disabled ? styles.IconDisabled : ''
              } ${iconSizeClassName}`}
              type={icon}
            />
            <span className={tabLabelClassName}>{label}</span>
          </label>
        );

        if (title) {
          button = (
            <Tooltip key={id} className={tooltipStyles.Tooltip} label={title}>
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </Fragment>
  );
}
