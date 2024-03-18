/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { RefreshIcon, ShareIcon, TrashIcon } from "@heroicons/react/outline";
import { CheckIcon } from "@heroicons/react/solid";
import clsx from "clsx";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { defaultStore, minimalStore } from "../lib/defaultStore";
import Logo from "./Logo";
import { useStoreDispatch } from "./StoreContext";

export default function Header() {
  const [showCheck, setShowCheck] = useState(false);
  const dispatchStore = useStoreDispatch();
  const { closeSnackbar } = useSnackbar();

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the playground?")) {
      /*
        Close open snackbars if any. This is necessary because when displaying
        outputs (Preview or not), we only close previous snackbars if we received
        new messages, which is needed in order to display "Bad URL" or success
        messages when loading Playground for the first time. Otherwise, messages
        such as "Bad URL" will be closed by the outputs calling `closeSnackbar`.
      */
      closeSnackbar();
      dispatchStore({ type: "setStore", payload: { store: defaultStore } });
    }
  };

  const handleWipe = () => {
    if (confirm("Are you sure you want to wipe the playground?")) {
      closeSnackbar();
      dispatchStore({ type: "setStore", payload: { store: minimalStore } });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(location.href).then(() => {
      setShowCheck(true);
      // Show the check mark icon briefly after URL is copied
      setTimeout(() => setShowCheck(false), 1000);
    });
  };

  return (
    <div className="fixed z-10 flex items-center justify-between w-screen px-5 py-3 bg-white border-b border-gray-200 h-14">
      <div className="flex items-center flex-none h-full gap-2 text-lg">
        <Logo
          className={clsx(
            "w-8 h-8 text-link",
            process.env.NODE_ENV === "development" && "text-yellow-600",
          )}
        />
        <p className="hidden select-none sm:block">React Forget Playground</p>
      </div>
      <div className="flex items-center text-[15px] gap-4">
        <button
          title="Wipe Playground"
          className="flex items-center gap-1 transition-colors duration-150 ease-in text-secondary hover:text-link"
          onClick={handleWipe}
        >
          <TrashIcon className="w-5 h-5" />
          <p className="hidden sm:block">Wipe</p>
        </button>
        <button
          title="Reset Playground"
          className="flex items-center gap-1 transition-colors duration-150 ease-in text-secondary hover:text-link"
          onClick={handleReset}
        >
          <RefreshIcon className="w-5 h-5" />
          <p className="hidden sm:block">Reset</p>
        </button>
        <button
          title="Copy sharable URL"
          className="flex items-center gap-1 transition-colors duration-150 ease-in text-secondary hover:text-link"
          onClick={handleShare}
          disabled={showCheck}
        >
          {!showCheck ? (
            <ShareIcon className="w-5 h-5" />
          ) : (
            <CheckIcon className="w-5 h-5 fill-blue-50" />
          )}
          <p className="hidden sm:block">Share</p>
        </button>
      </div>
    </div>
  );
}
