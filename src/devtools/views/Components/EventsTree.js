import { copy } from 'clipboard-js';
import React, { useCallback, useState } from 'react';
import styles from './EventsTree.css';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import { serializeDataForCopy } from '../utils';

type Props = {|
  events: Object,
|};

function EventsTreeView({ events }: Props) {
  const handleCopy = useCallback(() => copy(serializeDataForCopy(events)), [
    events,
  ]);

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
      <InnerEventsTreeView events={events} />
    </div>
  );
}

function InnerEventsTreeView({ events }: Props) {
  return events.map((event, index) => (
    <EventComponentView
      key={index}
      displayName={event.displayName}
      props={event.props}
    />
  ));
}

type EventComponentViewProps = {|
  displayName: string,
  props: null | Object,
|};

function EventComponentView({ displayName, props }: EventComponentViewProps) {
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
              name={name}
              path={[name]}
              value={(eventComponentProps: any)[name]}
            />
          ))}
      </div>
    </div>
  );
}

// $FlowFixMe
export default React.memo(EventsTreeView);
