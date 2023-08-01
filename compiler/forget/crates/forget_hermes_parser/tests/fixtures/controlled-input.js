function component() {
  let [x, setX] = useState(0);
  const handler = (event) => setX(event.target.value);
  return <input onChange={handler} value={x} />;
}
