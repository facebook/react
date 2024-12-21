// @lowerContextAccess
function App() {
  const {foo} = useContext(MyContext);
  const {bar} = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}
