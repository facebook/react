/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import Button from './Button';
import {useModalDismissSignal} from './hooks';

import styles from './ModalDialog.css';

type DIALOG_ACTION_HIDE = {|
  type: 'HIDE',
|};
type DIALOG_ACTION_SHOW = {|
  type: 'SHOW',
  canBeDismissed?: boolean,
  content: React$Node,
  title?: React$Node | null,
|};

type Action = DIALOG_ACTION_HIDE | DIALOG_ACTION_SHOW;

type Dispatch = (action: Action) => void;

type State = {|
  canBeDismissed: boolean,
  content: React$Node | null,
  isVisible: boolean,
  title: React$Node | null,
|};

type ModalDialogContextType = {|
  ...State,
  dispatch: Dispatch,
|};

const ModalDialogContext = createContext<ModalDialogContextType>(
  ((null: any): ModalDialogContextType),
);
ModalDialogContext.displayName = 'ModalDialogContext';

function dialogReducer(state, action) {
  switch (action.type) {
    case 'HIDE':
      return {
        canBeDismissed: true,
        content: null,
        isVisible: false,
        title: null,
      };
    case 'SHOW':
      return {
        canBeDismissed: action.canBeDismissed !== false,
        content: action.content,
        isVisible: true,
        title: action.title || null,
      };
    default:
      throw new Error(`Invalid action "${action.type}"`);
  }
}

type Props = {|
  children: React$Node,
|};

function ModalDialogContextController({children}: Props) {
  const [state, dispatch] = useReducer<State, Action>(dialogReducer, {
    canBeDismissed: true,
    content: null,
    isVisible: false,
    title: null,
  });

  const value = useMemo<ModalDialogContextType>(
    () => ({
      canBeDismissed: state.canBeDismissed,
      content: state.content,
      isVisible: state.isVisible,
      title: state.title,
      dispatch,
    }),
    [state, dispatch],
  );

  return (
    <ModalDialogContext.Provider value={value}>
      {children}
    </ModalDialogContext.Provider>
  );
}

function ModalDialog(_: {||}) {
  const {isVisible} = useContext(ModalDialogContext);
  return isVisible ? <ModalDialogImpl /> : null;
}

function ModalDialogImpl(_: {||}) {
  const {canBeDismissed, content, dispatch, title} = useContext(
    ModalDialogContext,
  );
  const dismissModal = useCallback(
    () => {
      if (canBeDismissed) {
        dispatch({type: 'HIDE'});
      }
    },
    [canBeDismissed, dispatch],
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // It's important to trap click events within the dialog,
  // so the dismiss hook will use it for click hit detection.
  // Because multiple tabs may be showing this ModalDialog,
  // the normal `dialog.contains(target)` check would fail on a background tab.
  useModalDismissSignal(dialogRef, dismissModal, false);

  // Clicks on the dialog should not bubble.
  // This way we can dismiss by listening to clicks on the background.
  const handleDialogClick = (event: any) => {
    event.stopPropagation();

    // It is important that we don't also prevent default,
    // or clicks within the dialog (e.g. on links) won't work.
  };

  return (
    <div className={styles.Background} onClick={dismissModal}>
      <div
        ref={dialogRef}
        className={styles.Dialog}
        onClick={handleDialogClick}>
        {title !== null && <div className={styles.Title}>{title}</div>}
        {content}
        {canBeDismissed && (
          <div className={styles.Buttons}>
            <Button
              autoFocus={true}
              className={styles.Button}
              onClick={dismissModal}>
              Okay
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export {ModalDialog, ModalDialogContext, ModalDialogContextController};
