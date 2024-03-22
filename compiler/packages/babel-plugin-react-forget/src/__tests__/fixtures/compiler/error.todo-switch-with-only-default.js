function Component({ kind, ...props }) {
  switch (kind) {
    default:
      return <Stringify {...props} />;
  }
}
