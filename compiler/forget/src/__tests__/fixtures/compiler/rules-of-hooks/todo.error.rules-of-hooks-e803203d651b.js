// @skip
// Passed but should have errored

(class {
  useHook = () => {
    useState();
  };
});
