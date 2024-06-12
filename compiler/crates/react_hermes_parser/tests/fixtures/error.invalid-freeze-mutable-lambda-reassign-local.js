function Component(props) {
  let x = "";
  const onChange = (e) => {
    x = e.target.value;
  };
  return <input value={x} onChange={onChange} />;
}
