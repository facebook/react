/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useContext, useEffect, useMemo, useRef} from 'react';
import {SettingsModalContext} from './SettingsModalContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import TabBar from '../TabBar';
import {StoreContext} from '../context';
import {
  useLocalStorage,
  useModalDismissSignal,
  useSubscription,
} from '../hooks';
import ComponentsSettings from './ComponentsSettings';
import GeneralSettings from './GeneralSettings';
import ProfilerSettings from './ProfilerSettings';

import styles from './SettingsModal.css';

type TabID = 'general' | 'components' | 'profiler';

export default function SettingsModal(_: {||}) {
  const {isModalShowing, setIsModalShowing} = useContext(SettingsModalContext);
  const store = useContext(StoreContext);
  const {profilerStore} = store;

  // Updating preferences while profiling is in progress could break things (e.g. filtering)
  // Explicitly disallow it for now.
  const isProfilingSubscription = useMemo(
    () => ({
      getCurrentValue: () => profilerStore.isProfiling,
      subscribe: (callback: Function) => {
        profilerStore.addListener('isProfiling', callback);
        return () => profilerStore.removeListener('isProfiling', callback);
      },
    }),
    [profilerStore],
  );
  const isProfiling = useSubscription<boolean>(isProfilingSubscription);
  if (isProfiling && isModalShowing) {
    setIsModalShowing(false);
  }

  if (!isModalShowing) {
    return null;
  }

  return <SettingsModalImpl />;
}

function SettingsModalImpl(_: {||}) {
  const {setIsModalShowing} = useContext(SettingsModalContext);
  const dismissModal = useCallback(() => setIsModalShowing(false), [
    setIsModalShowing,
  ]);

  const [selectedTabID, selectTab] = useLocalStorage<TabID>(
    'React::DevTools::selectedSettingsTabID',
    'general',
  );

  const modalRef = useRef<HTMLDivElement | null>(null);
  useModalDismissSignal(modalRef, dismissModal);

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, [modalRef]);

  let view = null;
  switch (selectedTabID) {
    case 'general':
      view = <GeneralSettings />;
      break;
    case 'profiler':
      view = <ProfilerSettings />;
      break;
    case 'components':
      view = <ComponentsSettings />;
      break;
    default:
      break;
  }

  return (
    <div className={styles.Background}>
      <div className={styles.Modal} ref={modalRef}>
        <div className={styles.Tabs}>
          <TabBar
            currentTab={selectedTabID}
            id="Settings"
            selectTab={selectTab}
            tabs={tabs}
            type="settings"
          />
          <div className={styles.Spacer} />
          <Button onClick={dismissModal} title="Close settings dialog">
            <ButtonIcon type="close" />
          </Button>
        </div>
        <div className={styles.Content}>{view}</div>
      </div>
    </div>
  );
}

const tabs = [
  {
    id: 'general',
    icon: 'settings',
    label: 'General',
  },
  {
    id: 'components',
    icon: 'components',
    label: 'Components',
  },
  {
    id: 'profiler',
    icon: 'profiler',
    label: 'Profiler',
  },
];
