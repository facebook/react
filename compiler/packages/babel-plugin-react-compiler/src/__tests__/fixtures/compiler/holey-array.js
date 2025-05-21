function t(props) {
  let [, setstate] = useState();
  setstate(1);
  return props.foo;
}

export const FIXTURE_ENTRYPOINT = {
  fn: t,
  params: ['TodoAdd'],
  isComponent: 'TodoAdd',
};
