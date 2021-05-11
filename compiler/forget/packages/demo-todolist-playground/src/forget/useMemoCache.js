import { useRef } from "react";

const placeholder = NaN;

export function useMemoCache(i) {
  const ref = useRef(new Array(i).fill(placeholder));
  return ref.current;
}
