function cloneStyleTags() {
  const linkTags = [];

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const linkTag of document.getElementsByTagName('link')) {
    if (linkTag.rel === 'stylesheet') {
      const newLinkTag = document.createElement('link');

      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const attribute of linkTag.attributes) {
        newLinkTag.setAttribute(attribute.nodeName, attribute.nodeValue);
      }

      linkTags.push(newLinkTag);
    }
  }

  return linkTags;
}

export default cloneStyleTags;
