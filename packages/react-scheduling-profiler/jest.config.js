module.exports = {
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    // Pass @elg/speedscope through transforms
    '/node_modules/(?!@elg/speedscope).+\\.js$',
  ],
};
