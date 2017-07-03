import getScrollTop from './getScrollTop';

const getOffsetTop = function(node) {
  return node.getBoundingClientRect().top + getScrollTop();
};

export default getOffsetTop;
