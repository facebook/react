// @lowerContextAccess
function App() {
  const context = useContext(MyContext);
  const foo = context.foo;
  const bar = context.bar;
  return <Bar foo={foo} bar={bar} />;
}
