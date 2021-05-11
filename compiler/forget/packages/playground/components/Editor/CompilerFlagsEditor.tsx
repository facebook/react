/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */
import { type ForgetCompilerFlags } from "../../lib/compilerDriver";
import { useStore, useStoreDispatch } from "../StoreContext";

export default function CompilerFlagsEditor() {
  const store = useStore();
  const dispatch = useStoreDispatch();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
      }}
    >
      {Object.keys(store.compilerFlags).map((f: string) => {
        const flag = f as keyof ForgetCompilerFlags;
        return (
          <label key={flag} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={store.compilerFlags[flag]}
              onChange={(e) =>
                dispatch({
                  type: "setCompilerFlag",
                  payload: { flag, value: e.target.checked },
                })
              }
            />
            {flag}
          </label>
        );
      })}
    </div>
  );
}
