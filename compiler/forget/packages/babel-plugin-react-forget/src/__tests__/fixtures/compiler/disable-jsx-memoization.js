// @memoizeJsxElements false
function Component(props) {
  const [name, setName] = useState(null);
  const onChange = function (e) {
    setName(e.target.value);
  };
  return (
    <form>
      <input onChange={onChange} value={name} />
    </form>
  );
}
