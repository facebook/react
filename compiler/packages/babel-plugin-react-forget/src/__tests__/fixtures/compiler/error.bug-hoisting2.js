function Component() {
  useRunOnceDuringRender(() => {
    const handler = () => {
      return () => {
        detachHandler(handler);
      };
    };
  });
}
