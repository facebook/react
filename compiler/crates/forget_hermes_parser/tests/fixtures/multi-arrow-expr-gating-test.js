// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

const Renderer = (props) => (
  <Foo>
    <Bar></Bar>
    <ErrorView></ErrorView>
  </Foo>
);

export default Renderer;
