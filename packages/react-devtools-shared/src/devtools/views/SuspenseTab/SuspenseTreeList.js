/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {SuspenseNode} from '../../../frontend/types';
import type Store from '../../store';

import * as React from 'react';
import {useContext} from 'react';
import {StoreContext} from '../context';
import {SuspenseTreeStateContext} from './SuspenseTreeContext';
import {TreeDispatcherContext} from '../Components/TreeContext';

function getDocumentOrderSuspenseTreeList(store: Store): Array<SuspenseNode> {
  const suspenseTreeList: SuspenseNode[] = [];
  for (let i = 0; i < store.roots.length; i++) {
    const root = store.getElementByID(store.roots[i]);
    if (root === null) {
      continue;
    }
    const suspense = store.getSuspenseByID(root.id);
    if (suspense !== null) {
      const stack = [suspense];
      while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) {
          continue;
        }
        suspenseTreeList.push(current);
        // Add children in reverse order to maintain document order
        for (let j = current.children.length - 1; j >= 0; j--) {
          const childSuspense = store.getSuspenseByID(current.children[j]);
          if (childSuspense !== null) {
            stack.push(childSuspense);
          }
        }
      }
    }
  }

  return suspenseTreeList;
}

export default function SuspenseTreeList(_: {}): React$Node {
  const store = useContext(StoreContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  useContext(SuspenseTreeStateContext);

  const suspenseTreeList = getDocumentOrderSuspenseTreeList(store);

  return (
    <div>
      <p>Suspense Tree List</p>
      <ul>
        {suspenseTreeList.map(suspense => {
          const {id, parentID, children, name} = suspense;
          return (
            <li key={id}>
              <div>
                <button
                  onClick={() => {
                    treeDispatch({
                      type: 'SELECT_ELEMENT_BY_ID',
                      payload: id,
                    });
                  }}>
                  inspect {name || 'N/A'} ({id})
                </button>
              </div>
              <div>
                <strong>Suspense ID:</strong> {id}
              </div>
              <div>
                <strong>Parent ID:</strong> {parentID}
              </div>
              <div>
                <strong>Children:</strong>{' '}
                {children.length === 0 ? '∅' : children.join(', ')}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
