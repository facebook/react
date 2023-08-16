function App({ text, hasDeps }) {
  const resolvedText = useMemo(
    () => {
      return text.toUpperCase();
    },
    hasDeps ? null : [text] // should be DCE'd
  );
  return resolvedText;
}

export const FIXTURE_ENTRYPOINT = {
  fn: App,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};
