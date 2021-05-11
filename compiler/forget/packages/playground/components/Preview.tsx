/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import LightBulbIcon from "@heroicons/react/solid/LightBulbIcon";
import { FormControlLabel, Switch } from "@mui/material";
import clsx from "clsx";
import invariant from "invariant";
import { useEffect, useRef, useState } from "react";
import { useMountEffect } from "../hooks";
import { bundle, BundleResult, defaultBundleRes } from "../lib/moduleBundler";
import { Store } from "../lib/stores";

const srcDoc = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <script>
      // Enable DevTools to inspect React inside of an <iframe>
      // This must run before React is loaded
      __REACT_DEVTOOLS_GLOBAL_HOOK__ = parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    </script>
    <script>
      window.addEventListener("message", async ({ data }) => {
        try {
          const { event, source, id } = data;
          if (event === "CodeUpdate") {
            const encodedCode = encodeURIComponent(source);
            const dataUri = "data:text/javascript;charset=utf-8," + encodedCode;
            await import(dataUri);
          }
        } catch (e) {
          console.error(e);
        }
      });
    </script>
  </head>
  <body>
    <div id="app" />
  </body>
</html>
`;

enum MessageType {
  CodeUpdate = "CodeUpdate",
}

export default function Preview({ store }: { store: Store }) {
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bundleRes, setBundleRes] = useState<BundleResult>(defaultBundleRes);
  const [enableForget, setEnableForget] = useState<boolean>(true);
  // used to invalidate import cache (when toggling enableForget)
  const [toggleCount, setToggleCount] = useState<number>(0);

  useMountEffect(() => {
    if (!iframeRef || !iframeRef.current) return;
    iframeRef.current.srcdoc = srcDoc;
    iframeRef.current.addEventListener("load", () => {
      setIframeReady(true);
    });
  });

  // Perform async operations which will trigger a 2nd render.
  useEffect(() => {
    async function bundleInputs() {
      const bundleRes = await bundle(store.files, store.compilerFlags);
      setBundleRes(bundleRes);
    }
    bundleInputs();
  }, [store.files, store.compilerFlags]);

  // Synchronzie with iframe and messaging UIs.
  useEffect(() => {
    if (!bundleRes) return;
    const { res } = bundleRes;

    if (iframeReady && res) {
      iframeRef.current!.contentWindow!.postMessage({
        event: MessageType.CodeUpdate,
        source: res.getCode(enableForget ? "after" : "before", toggleCount),
      });
    }
  }, [iframeReady, bundleRes, store.selectedFileId, enableForget, toggleCount]);

  const diff = bundleRes.res?.codeSizeDiff;
  const showCodeSizeChange = diff != null && enableForget;

  const ticker = (percentage: number) => (
    <>
      {percentage >= 0 ? "increased" : "decreased"} by{" "}
      <span
        className={clsx("text-red-600", {
          "text-emerald-600": percentage <= 0,
        })}
      >
        {Math.abs(percentage).toFixed(2)}%
      </span>
    </>
  );

  return (
    <div className="flex flex-col w-full h-full">
      <FormControlLabel
        className={"mx-3"}
        control={
          <Switch
            checked={enableForget}
            onChange={(e) => {
              setEnableForget(e.target.checked);
              setToggleCount(toggleCount + 1);
            }}
          />
        }
        label="Compile using Forget?"
      />
      {showCodeSizeChange && (
        <div className="flex items-center gap-1 p-2 bg-slate-200">
          <LightBulbIcon className="flex-none w-5 h-5 text-yellow-500" />
          <p className="text-sm">
            Compiled code size {ticker(diff.minPercent)} ({diff.min} minified)
            and {ticker(diff.gzipPercent)} ({diff.gzip} minified & gzipped) from
            the original.
          </p>
        </div>
      )}
      <iframe
        title="React Forget Playground"
        ref={iframeRef}
        className="flex-1 w-full"
      />
    </div>
  );
}
