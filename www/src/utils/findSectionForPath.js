import slugify from './slugify';

/**
 * Helper method to locate the section containing the current URL/path.
 * This method specifically works with the nav_*.yml format.
 */
const findSectionForPath = (pathname, sections) => {
  let activeSection;

  sections.forEach(section => {
    const match = section.items.some(item =>
      pathname.includes(slugify(item.id)),
    );
    if (match) {
      activeSection = section;
    }
  });

  return activeSection;
};

export default findSectionForPath;
