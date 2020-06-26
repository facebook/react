import React from 'react';
import styles from './SelectedEvent.module.css';

export default function SelectedEvent({selectedEvent, width}) {
  if (selectedEvent == null) {
    return null;
  }

  const {componentStack, duration, timestamp, type} = selectedEvent;

  let label = null;
  switch (type) {
    case 'commit-work':
      label = 'commit';
      break;
    case 'non-react-function-call':
      label = 'other script';
      break;
    case 'render-idle':
      label = 'idle';
      break;
    case 'render-work':
      label = 'render';
      break;
    case 'schedule-render':
      label = 'render scheduled';
      break;
    case 'schedule-state-update':
      label = `state update scheduled`;
      break;
    case 'suspend':
      label = `suspended`;
      break;
    default:
      break;
  }

  return (
    <div className={styles.SelectedEvent} style={{width}}>
      {label} {duration !== undefined ? `for ${duration}ms` : ''} at {timestamp}
      ms
      {componentStack && (
        <pre className={styles.ComponentStack}> {componentStack.trim()}</pre>
      )}
    </div>
  );
}
