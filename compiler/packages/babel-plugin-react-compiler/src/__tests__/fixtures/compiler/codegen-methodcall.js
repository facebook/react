function foo() {
  return {
    bar() {
      return 3.14;
    },
  };
}

const YearsAndMonthsSince = () => {
  const diff = foo();
  const months = Math.floor(diff.bar());
  return <>{months}</>;
};

export const FIXTURE_ENTRYPOINT = {
  fn: YearsAndMonthsSince,
  params: [],
  isComponent: true,
};
