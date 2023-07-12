function Component(props) {
  let x = true;
  let y;
  if (x) {
    y = 42;
  } else {
    y = "nope";
  }
  // TODO: constant propagate the value of `y` here. we can track which
  // blocks are reachable as we proceed through, and account for phi
  // operands for blocks that weren't reached.
  // something like: track a set of reachable blocks, which populate from
  // successors of previous block's terminals. but when we see an if w a
  // constant test value, we only populate as reachable the corresponding
  // branch's block.
  return y;
}
