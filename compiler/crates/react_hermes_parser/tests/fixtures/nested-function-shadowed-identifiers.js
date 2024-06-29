function Component(props) {
  const [x, setX] = useState(null);

  const onChange = (e) => {
    let x = null; // intentionally shadow the original x
    setX((currentX) => currentX + x); // intentionally refer to shadowed x
  };

  return <input value={x} onChange={onChange} />;
}
