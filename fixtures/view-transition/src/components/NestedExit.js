import React, {
  ViewTransition,
  useState,
  startTransition,
  addTransitionType,
} from 'react';

import './NestedExit.css';

const items = [
  {id: 1, title: 'First Post', body: 'Hello from the first post.'},
  {id: 2, title: 'Second Post', body: 'Hello from the second post.'},
  {id: 3, title: 'Third Post', body: 'Hello from the third post.'},
];

function FeedItem({item, index, onSelect}) {
  // Build exit/enter maps: for each possible clicked item, determine direction
  const exitMap = {};
  const enterMap = {};
  items.forEach((_, otherIndex) => {
    if (otherIndex !== index) {
      const key = 'select-' + otherIndex;
      exitMap[key] = index < otherIndex ? 'nested-exit-up' : 'nested-exit-down';
      enterMap[key] =
        index < otherIndex ? 'nested-enter-from-up' : 'nested-enter-from-down';
    }
  });

  const shareInner = {
    'nav-forward': 'nested-shared-inner-forward',
    'nav-back': 'nested-shared-inner-back',
  };

  return (
    <ViewTransition
      name={'nested-post-' + item.id}
      share={{
        'nav-forward': 'nested-shared-post-forward',
        'nav-back': 'nested-shared-post-back',
      }}
      exit={exitMap}
      enter={enterMap}>
      <div className="feed-item" onClick={() => onSelect(item, index)}>
        <ViewTransition name={'nested-title-' + item.id} share={shareInner}>
          <h3>{item.title}</h3>
        </ViewTransition>
        <ViewTransition name={'nested-body-' + item.id} share={shareInner}>
          <p>{item.body}</p>
        </ViewTransition>
      </div>
    </ViewTransition>
  );
}

function Detail({item, onBack}) {
  const shareInner = {
    'nav-forward': 'nested-shared-inner-forward',
    'nav-back': 'nested-shared-inner-back',
  };

  return (
    <ViewTransition
      name={'nested-post-' + item.id}
      share={{
        'nav-forward': 'nested-shared-post-forward',
        'nav-back': 'nested-shared-post-back',
      }}
      enter={{'permalink-navigation': 'nested-enter-detail'}}>
      <div className="detail-view">
        <ViewTransition
          enter={{'nav-forward': 'nested-back-btn-enter'}}
          exit={{'nav-back': 'nested-back-btn-exit'}}>
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        </ViewTransition>
        <ViewTransition name={'nested-title-' + item.id} share={shareInner}>
          <h3>{item.title}</h3>
        </ViewTransition>
        <ViewTransition name={'nested-body-' + item.id} share={shareInner}>
          <p>{item.body}</p>
        </ViewTransition>
        <ViewTransition
          enter={{'nav-forward': 'nested-extra-enter'}}
          exit={{'nav-back': 'nested-extra-exit'}}>
          <p>This is the detail view with more content.</p>
        </ViewTransition>
      </div>
    </ViewTransition>
  );
}

export default function NestedExit() {
  const [selected, setSelected] = useState(null);

  function selectItem(item, clickedIndex) {
    startTransition(() => {
      addTransitionType('permalink-navigation');
      addTransitionType('nav-forward');
      addTransitionType('select-' + clickedIndex);
      setSelected(item);
    });
  }

  function goBack() {
    const backIndex = items.findIndex(i => i.id === selected.id);
    startTransition(() => {
      addTransitionType('permalink-navigation');
      addTransitionType('nav-back');
      addTransitionType('select-' + backIndex);
      setSelected(null);
    });
  }

  return (
    <div className="nested-exit-demo">
      <h3>Nested Exit/Enter</h3>
      <ViewTransition key={selected ? 'detail' : 'feed'}>
        {selected ? (
          <Detail item={selected} onBack={goBack} />
        ) : (
          <div>
            {items.map((item, index) => (
              <FeedItem
                key={item.id}
                item={item}
                index={index}
                onSelect={selectItem}
              />
            ))}
          </div>
        )}
      </ViewTransition>
    </div>
  );
}
