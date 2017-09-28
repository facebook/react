const readFileSync = require('fs').readFileSync;
const resolve = require('path').resolve;
const safeLoad = require('js-yaml').safeLoad;

// TODO It would be nice to replace this plugin with gatsby-transformer-yaml
// That plugin errors on some of the YML files in the docs folder though,
// And doesn't currently support any options to whitelist/blacklist files.

// Reads authors.yml data into GraphQL.
// This is auto-linked by gatsby-config.js to blog posts.
exports.sourceNodes = ({graphql, boundActionCreators}) => {
  const {createNode} = boundActionCreators;

  const path = resolve(__dirname, '../../../docs/_data/authors.yml');
  const file = readFileSync(path, 'utf8');
  const authors = safeLoad(file);

  // authors.yml structure is {[username: string]: {name: string, url: string}}
  Object.keys(authors).forEach(username => {
    const author = authors[username];

    createNode({
      id: username,
      children: [],
      parent: 'AUTHORS',
      internal: {
        type: 'AuthorYaml',
        contentDigest: JSON.stringify(author),
      },
      frontmatter: author,
    });
  });
};
