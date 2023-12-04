import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  let useFeature = makeObject_Primitives();
  let x;
  if (useFeature) {
    x = [useFeature + useFeature].push(-useFeature);
  }
  let y = useFeature;
  let z = useFeature.useProperty;
  return (
    <div onClick={useFeature}>
      {x}
      {y}
      {z}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
