// @Out DumpCFG
function useForOfStatement(x) {
  "use forget";
  const items = [];
  let item;
  for (item of x) {
    if (shouldBreak()) {
      break;
    } else if (shouldContinue()) {
      continue;
    }
    items.push(item);
  }
  return items;
}
