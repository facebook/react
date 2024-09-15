// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export const Renderer = props => (
  <Foo>
    <Bar></Bar>
    <ErrorView></ErrorView>
  </Foo>
);
