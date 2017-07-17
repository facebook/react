export function loadStylesheet(url) {
  let link = document.createElement('link');

  link.rel = 'stylesheet';
  link.href = url;

  // Avoid blocking
  // http://keithclark.co.uk/articles/loading-css-without-blocking-render/
  link.media = 'none';

  link.onload = () => {
    if (link.media !== 'all') {
      link.media = 'all';
    }
  };

  document.head.appendChild(link);
}
