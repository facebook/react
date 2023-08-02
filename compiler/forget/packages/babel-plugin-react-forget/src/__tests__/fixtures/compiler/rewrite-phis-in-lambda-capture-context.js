function ConstantPropagationBug() {
  const x = CONSTANT1;
  const createPhiNode = CONSTANT2 || 5;

  const getFoo = () => <Foo x={x} y={createPhiNode} />;

  return getFoo();
}
