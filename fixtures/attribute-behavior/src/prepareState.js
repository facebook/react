function prepareState(initGlobals) {
  function getRenderedAttributeValues(attribute, type) {
    const {
      ReactStable,
      ReactDOMStable,
      ReactDOMServerStable,
      ReactNext,
      ReactDOMNext,
      ReactDOMServerNext,
    } = initGlobals(attribute, type);
    const reactStableValue = getRenderedAttributeValue(
      ReactStable,
      ReactDOMStable,
      ReactDOMServerStable,
      attribute,
      type
    );
    const reactNextValue = getRenderedAttributeValue(
      ReactNext,
      ReactDOMNext,
      ReactDOMServerNext,
      attribute,
      type
    );

    let hasSameBehavior;
    if (reactStableValue.didError && reactNextValue.didError) {
      hasSameBehavior = true;
    } else if (!reactStableValue.didError && !reactNextValue.didError) {
      hasSameBehavior =
        reactStableValue.didWarn === reactNextValue.didWarn &&
        reactStableValue.canonicalResult === reactNextValue.canonicalResult &&
        reactStableValue.ssrHasSameBehavior ===
          reactNextValue.ssrHasSameBehavior;
    } else {
      hasSameBehavior = false;
    }

    return {
      reactStable: reactStableValue,
      reactNext: reactNextValue,
      hasSameBehavior,
    };
  }

  const table = new Map();
  const rowPatternHashes = new Map();

  // Disable error overlay while testing each attribute
  uninjectErrorOverlay();
  for (let attribute of attributes) {
    const results = new Map();
    let hasSameBehaviorForAll = true;
    let rowPatternHash = '';
    for (let type of types) {
      const result = getRenderedAttributeValues(attribute, type);
      results.set(type.name, result);
      if (!result.hasSameBehavior) {
        hasSameBehaviorForAll = false;
      }
      rowPatternHash += [result.reactStable, result.reactNext]
        .map(res =>
          [
            res.canonicalResult,
            res.canonicalDefaultValue,
            res.didWarn,
            res.didError,
          ].join('||')
        )
        .join('||');
    }
    const row = {
      results,
      hasSameBehaviorForAll,
      rowPatternHash,
      // "Good enough" id that we can store in localStorage
      rowIdHash: `${attribute.name} ${attribute.tagName} ${attribute.overrideStringValue}`,
    };
    const rowGroup = rowPatternHashes.get(rowPatternHash) || new Set();
    rowGroup.add(row);
    rowPatternHashes.set(rowPatternHash, rowGroup);
    table.set(attribute, row);
  }

  // Renable error overlay
  injectErrorOverlay();

  return {
    table,
    rowPatternHashes,
  };
}

export default prepareState;
