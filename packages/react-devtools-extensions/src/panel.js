// Portal target container.
window.container = document.getElementById('container');

let hasInjectedStyles = false;

// DevTools styles are injected into the top-level document head (where the main React app is rendered).
// This method copies those styles to the child window where each panel (e.g. Elements, Profiler) is portaled.
window.injectStyles = getLinkTags => {
  if (!hasInjectedStyles) {
    hasInjectedStyles = true;

    const linkTags = getLinkTags();

    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const linkTag of linkTags) {
      document.head.appendChild(linkTag);
    }
  }
};

// Banner event listener to close the banner when "X" button is clicked
const closeButton = document.querySelector('.dismissable-banner .close');
closeButton.addEventListener('click', () => {
  // Get the parent element of the "X" (the banner) and remove it
  const banner = closeButton.parentElement;
  banner.remove();
});

// Remove the banner if React Conf is over (after May 16, 2024)
const currentDate = new Date();
const may162024 = new Date('May 16, 2024');
if (currentDate > may162024) {
  const banner = document.querySelector('.dismissable-banner');
  banner.remove();
}
