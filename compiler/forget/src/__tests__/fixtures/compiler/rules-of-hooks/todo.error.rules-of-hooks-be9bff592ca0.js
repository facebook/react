// @skip
// Passed but should have errored

(class {
  h = () => {
    useState();
  };
});
