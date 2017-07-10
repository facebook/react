const dateToString = date =>
  (typeof date.toLocaleDateString === 'function'
    ? date.toLocaleDateString()
    : date.toDateString());

export default dateToString;
