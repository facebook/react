/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import XIcon from "@heroicons/react/solid/XIcon";
import clsx from "clsx";
import type { RefObject } from "react";
import { memo, useEffect, useRef, useState } from "react";

const MemoizedInputTab = memo(InputTab);

export default MemoizedInputTab;

function InputTab({
  tabId,
  autoFocus,
  allowEdit,
  isDeletable,
  borderColor,
  cursorStyle,
  onMountEffect,
  onSubmit,
  onDelete,
  onSwitchTab,
}: {
  tabId: string;
  autoFocus: boolean;
  allowEdit: boolean;
  isDeletable: boolean;
  borderColor: string;
  cursorStyle: string;
  onMountEffect: (tabId: string, tabRef: RefObject<HTMLDivElement>) => void;
  onSubmit: (oldTabId: string, newTabId: string) => void;
  onDelete: (tabId: string) => void;
  onSwitchTab: (tabId: string) => void;
}) {
  const [newTabId, setNewTabId] = useState(tabId);
  const tabIdWidth = `${newTabId.length}ch`;
  const [isEditing, setIsEditing] = useState(autoFocus);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMountEffect(tabId, tabRef);
  }, [tabId, onMountEffect]);

  return (
    <div
      ref={tabRef}
      className={clsx(
        "border-b-2 border-white px-2.5 py-0.5 h-full flex flex-1 items-center cursor-pointer",
        borderColor
      )}
      onClick={() => {
        onSwitchTab(tabId);
      }}
    >
      {isEditing ? (
        <form
          spellCheck={false}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(tabId, newTabId);
          }}
        >
          <input
            type="text"
            autoFocus
            value={newTabId}
            style={{ width: tabIdWidth }}
            className={clsx("text-center bg-white outline-none", {
              "text-gray-500": isEditing,
            })}
            onChange={(e) => setNewTabId(e.target.value)}
            onBlur={(e) => {
              // Stop if clicking on delete button.
              if (e.relatedTarget && e.relatedTarget.id === "delete-button")
                return;
              setIsEditing(false);
              onSubmit(tabId, newTabId);
            }}
          />
        </form>
      ) : (
        <div
          style={{ width: tabIdWidth }}
          className={clsx("text-center", cursorStyle)}
          onClick={() => {
            if (allowEdit) setIsEditing(true);
          }}
        >
          {tabId}
        </div>
      )}
      {isDeletable ? (
        <button
          id="delete-button"
          className="relative top-[1px] z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tabId);
          }}
        >
          <XIcon className="w-[18px] h-[18px] transition-colors duration-150 ease-in hover:fill-gray-800 fill-gray-500" />
        </button>
      ) : null}
    </div>
  );
}
