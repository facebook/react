import _range from "lodash/range";
import _random from "lodash/random";

const cachedData = new Map();

// Random data for the chart
export const getStreamData = (input) => {
  if (cachedData.has(input)) {
    return cachedData.get(input);
  }
  const multiplier = input.length !== 0 ? input.length : 1;
  const complexity =
    (parseInt(window.location.search.slice(1), 10) / 100) * 25 || 25;

  const data = _range(5).map((t) =>
    _range(complexity * multiplier).map((j, i) => {
      return {
        x: j,
        y: (t + 1) * _random(0, 255),
      };
    })
  );
  cachedData.set(input, data);
  return data;
};
