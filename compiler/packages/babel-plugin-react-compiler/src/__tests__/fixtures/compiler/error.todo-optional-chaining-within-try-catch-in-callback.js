function Component(props) {
  const callback = async () => {
    try {
      const result = await fetch(props.url);
      return result?.error;
    } catch (e) {
      return null;
    }
  };
  return callback;
}
