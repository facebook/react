function Component(props) {
  const ref = useRef(null);
  const onChange = (e) => {
    ref.current = e.target.value;
  };
  useEffect(() => {
    console.log(ref.current);
  });
  return <Foo onChange={onChange} />;
}
