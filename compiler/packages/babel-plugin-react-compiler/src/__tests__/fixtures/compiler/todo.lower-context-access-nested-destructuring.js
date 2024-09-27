// @lowerContextAccess
function App() {
  const {
    joe: {foo},
    bar,
  } = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}
