// @flow

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SettingsModalContext } from './SettingsModalContext';
import Store from 'src/devtools/store';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import TabBar from '../TabBar';
import { StoreContext } from '../context';
import { useModalDismissSignal, useSubscription } from '../hooks';
import ComponentsSettings from './ComponentsSettings';
import GeneralSettings from './GeneralSettings';
import ProfilerSettings from './ProfilerSettings';

import styles from './SettingsModal.css';

type TabID = 'general' | 'components' | 'profiler';

type Props = {|
  defaultTabID: TabID,
|};

export default function SettingsModal({ defaultTabID = 'general' }: Props) {
  const { isModalShowing, setIsModalShowing } = useContext(
    SettingsModalContext
  );
  const store = useContext(StoreContext);
  const { profilerStore } = store;

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
    [profilerStore]
  );
  const isProfiling = useSubscription<boolean, Store>(isProfilingSubscription);
  if (isProfiling && isModalShowing) {
    setIsModalShowing(false);
  }

  if (!isModalShowing) {
    return null;
  }

  return <SettingsModalImpl defaultTabID={defaultTabID} />;
}

function SettingsModalImpl({ defaultTabID }: Props) {
  const { setIsModalShowing } = useContext(SettingsModalContext);
  const dismissModal = useCallback(() => setIsModalShowing(false), [
    setIsModalShowing,
  ]);

  const [selectedTabID, selectTab] = useState<TabID>(defaultTabID);

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
            size="small"
            tabs={tabs}
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
    title: 'General preferences',
  },
  {
    id: 'components',
    icon: 'components',
    label: 'Components',
    title: 'Components preferences',
  },
  {
    id: 'profiler',
    icon: 'profiler',
    label: 'Profiler',
    title: 'Profiler preferences',
  },
];
