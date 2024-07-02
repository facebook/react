// @enablePreserveExistingManualUseMemoAsScope
import { useMemo } from "react";
let cur = 99;
function random(id) {
  "use no forget";
  cur = cur + 1;
  return cur;
}

export default function C(id) {
  const r = useMemo(() => random(id.id), [id.id]);
  const a = r + 1;
  return <>{a}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{ id: 1 }],
  sequentialRenders: [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
};
