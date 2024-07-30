import fbt from 'fbt';
function useFoo({apples, bananas}) {
  return fbt(
    `${fbt.param('number of apples', apples)} ` +
      fbt.plural('apple', apples) +
      ` and ${fbt.param('number of bananas', bananas)} ` +
      fbt.plural('banana', bananas),
    'TestDescription',
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{apples: 1, bananas: 2}],
};
