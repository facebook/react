// @lowerContextAccess
function App() {
  const context = useContext(MyContext);
  const {foo} = context;
  const {bar} = context;
  return <Bar foo={foo} bar={bar} />;
}
