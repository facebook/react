export const getDefaultActiveSection = (pathname, sections) => {
  let activeSection = sections[0]; // Default to first

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

export const slugify = id => `${id}.html`;
