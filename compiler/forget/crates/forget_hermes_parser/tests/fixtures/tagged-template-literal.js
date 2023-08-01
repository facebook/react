function component() {
  let t = graphql`
    fragment List_viewer on Viewer
    @argumentDefinitions(
      count: {
        type: "Int"
        defaultValue: 10
        directives: ["@int_max_value(logged_in: 10)"]
      }
      cursor: { type: "ID" }
    )

  `;

  return t;
}
