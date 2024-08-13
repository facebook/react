// @customType

import custom from 'custom';

function Component(props) {
  const x = [props.x];
  const y = [props.y];

  useHook();

  custom(x);
  custom.prop(x);
  custom.notPresent(y);

  return <Foo x={x} y={y} />;
}
