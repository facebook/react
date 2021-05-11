/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { PlusIcon } from "@heroicons/react/solid";
import invariant from "invariant";
import { useSnackbar } from "notistack";
import { useState, type RefObject } from "react";
import {
  checkInputFile,
  createInputFile,
  createMessage,
  MessageLevel,
  MessageSource,
  type Store,
} from "../../lib/stores";
import { useStore, useStoreDispatch } from "../StoreContext";
import InputTab from "./InputTab";

export default function InputTabSelector() {
  const store = useStore();
  const dispatchStore = useStoreDispatch();
  const [isCreating, setIsCreating] = useState(false);
  const tabIds = isCreating
    ? [...store.files.map((f) => f.id), generateUniqueFileId(store.files)]
    : store.files.map((f) => f.id);
  const { enqueueSnackbar } = useSnackbar();

  const handleMountEffect = (
    tabId: string,
    tabRef: RefObject<HTMLDivElement>
  ) => {
    const isPendingCreation = isCreating && tabIds[tabIds.length - 1] === tabId;
    if (isPendingCreation || store.selectedFileId === tabId) {
      // Scroll new or selected tab into view when loading the page, switching tabs,
      // and adding new tabs.
      tabRef.current?.scrollIntoView({
        block: "nearest",
        inline: "start",
        behavior: "smooth",
      });
    }
  };

  // Create a new tab.
  const handleAddTab = (_oldTabId: string, newTabId: string) => {
    try {
      const newTab = createInputFile(newTabId, "");
      checkInputFile(newTab, undefined, store);

      dispatchStore({
        type: "addFile",
        payload: { file: newTab },
      });
      setIsCreating(false);
    } catch (e) {
      if (e instanceof Error) {
        enqueueSnackbar(e.message, {
          variant: "message",
          ...createMessage(
            e.message,
            MessageLevel.Error,
            MessageSource.Playground
          ),
        });
      }
    }
  };

  // Update ID of an existing tab.
  const handleUpdateId = (oldTabId: string, newTabId: string) => {
    if (newTabId === oldTabId) return;
    const oldTab = store.files.find((f) => f.id === oldTabId);
    invariant(oldTab, "Tab being updated must exist.");

    try {
      const newTab = createInputFile(newTabId, oldTab.content);
      checkInputFile(newTab, oldTab, store);

      dispatchStore({
        type: "updateFile",
        payload: { oldFileId: oldTabId, file: newTab },
      });
    } catch (e) {
      if (e instanceof Error) {
        enqueueSnackbar(e.message, {
          variant: "message",
          ...createMessage(
            e.message,
            MessageLevel.Error,
            MessageSource.Playground
          ),
        });
      }
    }
  };

  const handleDeleteTab = (tabId: string) => {
    // Tab being created.
    if (isCreating) {
      setIsCreating(false);
    }
    // Existing tabs.
    else {
      const ok = confirm(`Are you sure you want to delete ${tabId}?`);
      if (!ok) return;

      dispatchStore({
        type: "deleteFile",
        payload: { fileId: tabId },
      });
    }
  };

  const handleSwitchTab = (tabId: string) => {
    const isPendingCreation = isCreating && tabIds[tabIds.length - 1] === tabId;
    if (!isPendingCreation) {
      dispatchStore({
        type: "switchInputTab",
        payload: { selectedFileId: tabId },
      });
    }
  };

  return (
    <div className="relative flex w-full border-b border-gray-200 h-9">
      <div className="flex h-full overflow-x-auto no-scrollbar">
        {tabIds.map((tabId, index) => {
          // Hide _app.js on UI.
          if (tabId === "_app.js") return;

          const isSelected = store.selectedFileId === tabId;
          const isPendingCreation = isCreating && index === tabIds.length - 1;
          const isIndexTab = index === 1;
          const isDeletable = !isIndexTab || isPendingCreation;
          const shouldDivide = index < tabIds.length - 1;

          return (
            <div
              className="flex items-center h-full"
              // So that once the new tab is created its states are reset,
              // essentially blurring its input field (especially when creating
              // the tab by pressing Enter).
              key={`${tabId}${isPendingCreation ? "_new" : ""}`}
            >
              <InputTab
                tabId={tabId}
                autoFocus={isPendingCreation}
                allowEdit={isSelected}
                isDeletable={isDeletable}
                borderColor={
                  isPendingCreation
                    ? "border-gray-400"
                    : isSelected
                    ? "border-link"
                    : "border-white"
                }
                cursorStyle={
                  isSelected || isPendingCreation
                    ? "cursor-text"
                    : "cursor-pointer"
                }
                onMountEffect={handleMountEffect}
                onSubmit={isPendingCreation ? handleAddTab : handleUpdateId}
                onDelete={handleDeleteTab}
                onSwitchTab={handleSwitchTab}
              />
              {shouldDivide && (
                <div className="w-[1px] h-[18px] border-gray-200 border-l mx-1" />
              )}
            </div>
          );
        })}
      </div>
      <button
        className="z-10 flex items-center justify-center flex-none w-8 h-full bg-transparent group"
        onClick={() => setIsCreating(true)}
      >
        <PlusIcon className="w-[18px] h-[18px] transition-colors duration-150 ease-in group-hover:fill-gray-800 fill-gray-500" />
      </button>
      <div className="absolute w-16 h-full right-8 bg-gradient-to-l from-white" />
    </div>
  );
}

/**
 * Generate a file ID different from those of exsiting @param inputFiles.
 */
function generateUniqueFileId(inputFiles: Store["files"]) {
  let name = "Component";
  const ext = "js";

  let i = 0;
  while (true) {
    if (inputFiles.find((f) => f.id === `${name}.${ext}`)) {
      name = `Component${++i}`;
    } else {
      break;
    }
  }

  return `${name}.${ext}`;
}
