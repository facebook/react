// @flow

import { copy } from 'clipboard-js';
import React, { useCallback, useState } from 'react';
import styles from './EventsTree.css';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import { serializeDataForCopy } from '../utils';

import type { GetInspectedElementPath } from './InspectedElementContext';

type InspectPath = (path: Array<string | number>) => void;

type EventsTreeViewProps = {|
  events: Object,
  getInspectedElementPath: GetInspectedElementPath,
  id: number,
|};

function EventsTreeView({
  events,
  getInspectedElementPath,
  id,
}: EventsTreeViewProps) {
  const handleCopy = useCallback(() => copy(serializeDataForCopy(events)), [
    events,
  ]);

  const inspectPath = useCallback(
    (path: Array<string | number>) => {
      getInspectedElementPath(id, ['events', ...path]);
    },
    [getInspectedElementPath, id]
  );

  return (
    <div className={styles.EventsTree}>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>events</div>
        {
          <Button onClick={handleCopy} title="Copy to clipboard">
            <ButtonIcon type="copy" />
          </Button>
        }
      </div>
      <InnerEventsTreeView events={events} inspectPath={inspectPath} />
    </div>
  );
}

type InnerEventsTreeViewProps = {|
  events: Object,
  inspectPath: InspectPath,
|};

function InnerEventsTreeView({
  events,
  inspectPath,
}: InnerEventsTreeViewProps) {
  return events.map((event, index) => (
    <EventComponentView
      key={index}
      displayName={event.displayName}
      index={index}
      inspectPath={inspectPath}
      props={event.props}
    />
  ));
}

type EventComponentViewProps = {|
  displayName: string,
  index: number,
  inspectPath: InspectPath,
  props: null | Object,
|};

function EventComponentView({
  displayName,
  index,
  inspectPath,
  props,
}: EventComponentViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  let eventComponentProps = null;
  // eslint-disable-next-line no-unused-vars
  let children;

  if (props !== null) {
    // We don't want children, so extract it out
    ({ children, ...eventComponentProps } = props);
  }

  return (
    <div>
      <div className={styles.NameValueRow}>
        <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        <span onClick={() => {}} className={styles.Name}>
          {displayName}
        </span>
      </div>
      <div className={styles.Children} hidden={!isOpen}>
        {eventComponentProps === null && (
          <div className={styles.Empty}>None</div>
        )}
        {eventComponentProps !== null &&
          Object.keys((eventComponentProps: any)).map(name => (
            <KeyValue
              key={name}
              depth={1}
              inspectPath={inspectPath}
              name={name}
              path={[index]}
              value={(eventComponentProps: any)[name]}
            />
          ))}
      </div>
    </div>
  );
}

// $FlowFixMe
export default React.memo(EventsTreeView);
