import {PrimitiveBox} from 'shared-runtime';

function Component({value, realmax}) {
  const box = new PrimitiveBox(value);
  const maxValue = Math.max(box.get(), realmax);
  //                        ^^^^^^^^^ should not be separated into static call
  return <div>{maxValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 42, realmax: 100}],
  isComponent: true,
};
