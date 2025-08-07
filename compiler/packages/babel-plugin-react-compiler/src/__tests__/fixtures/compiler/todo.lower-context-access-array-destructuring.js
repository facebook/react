// @lowerContextAccess
function App() {
  const [foo, bar] = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}
