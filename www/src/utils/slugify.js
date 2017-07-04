import slugify from 'underscore.string/slugify';

export default string => slugify(string) + '.html';
