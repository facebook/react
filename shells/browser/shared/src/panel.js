const container = document.getElementById('container');

let hasInjectedStyles = false;

window.render = (renderRootToPortal, tab) => {
  container.innerHTML = '';

  const linkTags = renderRootToPortal({
    overrideTab: tab,
    portalContainer: container,
  });

  if (!hasInjectedStyles) {
    hasInjectedStyles = true;

    for (let linkTag of linkTags) {
      document.head.appendChild(linkTag);
    }
  }
};
