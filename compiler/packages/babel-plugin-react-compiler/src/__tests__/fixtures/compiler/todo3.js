import fbt from 'fbt';
/**
 * See comment in MergeOverlapping (changes MergeOverlapping and InferScope ->
 * don't count primitives)
 */
function CometAdsSideFeedUnit({adsSideFeedUnit}) {
  let adNodes = adsSideFeedUnit.nodes;
  adNodes = adNodes.slice(0, 2);

  const adNodesLength = adNodes.length;

  return adNodes.mmap(i => {
    return <Item hasBottomDivider={i !== adNodesLength - 1} />;
  });
}
