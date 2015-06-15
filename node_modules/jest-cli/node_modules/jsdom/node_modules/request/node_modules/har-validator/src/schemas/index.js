'use strict'

var schemas = {
  cache: require('./cache.json'),
  cacheEntry: require('./cacheEntry.json'),
  content: require('./content.json'),
  cookie: require('./cookie.json'),
  creator: require('./creator.json'),
  entry: require('./entry.json'),
  har: require('./har.json'),
  log: require('./log.json'),
  page: require('./page.json'),
  pageTimings: require('./pageTimings.json'),
  postData: require('./postData.json'),
  record: require('./record.json'),
  request: require('./request.json'),
  response: require('./response.json'),
  timings: require('./timings.json')
}

// is-my-json-valid does not provide meaningful error messages for external schemas
// this is a workaround
schemas.cache.properties.beforeRequest = schemas.cacheEntry
schemas.cache.properties.afterRequest = schemas.cacheEntry

schemas.page.properties.pageTimings = schemas.pageTimings

schemas.request.properties.cookies.items = schemas.cookie
schemas.request.properties.headers.items = schemas.record
schemas.request.properties.queryString.items = schemas.record
schemas.request.properties.postData = schemas.postData

schemas.response.properties.cookies.items = schemas.cookie
schemas.response.properties.headers.items = schemas.record
schemas.response.properties.content = schemas.content

schemas.entry.properties.request = schemas.request
schemas.entry.properties.response = schemas.response
schemas.entry.properties.cache = schemas.cache
schemas.entry.properties.timings = schemas.timings

schemas.log.properties.creator = schemas.creator
schemas.log.properties.browser = schemas.creator
schemas.log.properties.pages.items = schemas.page
schemas.log.properties.entries.items = schemas.entry

schemas.har.properties.log = schemas.log

module.exports = schemas
