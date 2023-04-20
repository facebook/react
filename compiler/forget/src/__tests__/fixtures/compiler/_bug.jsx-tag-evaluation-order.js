function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = View;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.
  return <Tag>{((Tag = HScroll), maybeMutae(maybeMutable))}</Tag>;
}
