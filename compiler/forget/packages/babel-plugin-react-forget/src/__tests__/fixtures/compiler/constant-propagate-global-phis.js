function Test() {
  const { tab } = useFoo();
  const currentTab = tab === WAT ? WAT : BAR;

  return <Foo value={currentTab} />;
}
