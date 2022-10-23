/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */
import clsx from "clsx";
import type { ForgetCompilerFlags } from "../../lib/compilerDriver";
import { useStore, useStoreDispatch } from "../StoreContext";

// TODO: Allow collapsing the compiler options editor
export default function CompilerFlagsEditor() {
  const store = useStore();
  const dispatch = useStoreDispatch();

  return (
    <div className="flex flex-col gap-2 px-5 py-4 border-t border-gray-200">
      <div>
        <h3 className="font-medium">Compiler Options</h3>
      </div>
      <div className="flex flex-col">
        {Object.keys(store.compilerFlags).map((f) => {
          const flag = f as keyof ForgetCompilerFlags;
          const isChecked = store.compilerFlags[flag];

          return (
            <label key={flag} className="flex gap-1.5 text-base">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) =>
                  dispatch({
                    type: "setCompilerFlag",
                    payload: { flag, value: e.target.checked },
                  })
                }
              />
              <span
                className={clsx("text-gray-500", { "text-black": isChecked })}
              >
                {flag}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
