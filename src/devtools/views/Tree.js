// @flow

import React, { useContext } from 'react';
import Element from './Element';
import { StoreContext } from './contexts';
import { useElement, useRoots } from './hooks';

import styles from './Tree.css';

type TreeProps = {||};

export default function Tree(props: TreeProps) {
  const store = useContext(StoreContext);
  const roots = useRoots(store);

  return (
    <div className={styles.Tree}>
      {roots.map(id => (
        <Root key={id} id={id} />
      ))}
    </div>
  );
}

type RootProps = {|
  id: string,
|};

function Root({ id }: RootProps) {
  const store = useContext(StoreContext);
  const element = useElement(store, id);

  // DevTools are rendered in concurrent mode.
  // It's possible the store has updated since the commit that triggered this render.
  // So we need to guard against an undefined element.
  // TODO: Handle this by switching to a Suspense based approach.
  if (element == null) {
    return null;
  }

  return element.children.map(childID => (
    <Element key={childID} depth={0} id={childID} />
  ));
}
