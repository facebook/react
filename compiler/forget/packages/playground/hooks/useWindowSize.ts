/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import { useState } from "react";
import useMountEffect from "./useMountEffect";

/**
 * @returns the latest window width and height before/after
 * resizing the window.
 */
export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useMountEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  });

  useMountEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return windowSize;
}
