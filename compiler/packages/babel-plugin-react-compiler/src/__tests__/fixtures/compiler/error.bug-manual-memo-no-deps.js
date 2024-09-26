// @validatePreserveExistingMemoizationGuarantees
function Wat() {
  const numbers = useMemo(() => getNumbers(), []);
  return numbers.map(num => <div key={num} />);
}

function getNumbers() {
  return [1, 2, 3];
}
