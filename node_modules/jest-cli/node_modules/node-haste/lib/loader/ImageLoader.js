/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var inherits = require('util').inherits;
var childProcess = require('child_process');
var fs = require('fs');

var ResourceLoader = require('./ResourceLoader');
var ImageResource = require('../resource/Image');
var MessageList = require('../MessageList');
var getImageSize = require('../parse/getImageSize');


/**
 * @class Loads and parses __mocks__ / *.js files
 *
 * @extends {ResourceLoader}
 */
function ImageLoader(options) {
  ResourceLoader.call(this, options);
}
inherits(ImageLoader, ResourceLoader);
ImageLoader.prototype.path = __filename;

ImageLoader.prototype.getResourceTypes = function() {
  return [ImageResource];
};

ImageLoader.prototype.getExtensions = function() {
  return ['.jpg', '.png', '.gif'];
};


/**
 * Creates a new resource for a given path.
 *
 * @protected
 * @param {String}               path      resource being built
 * @param {ProjectConfiguration} configuration configuration for the path
 * @param {Function}             callback
 */
ImageLoader.prototype.loadFromPath =
  function(path, configuration, callback) {

  var image = new ImageResource(path);
  var messages = MessageList.create();
  image.id = path;
  fs.readFile(path, function(err, buffer) {
    image.networkSize = buffer.length;
    var size = getImageSize(buffer);
    if (size) {
      image.width = size.width;
      image.height = size.height;
    }
    callback(messages, image);
  });
};


var re = /\.(jpg|gif|png)$/;
/**
 * Only match __mocks__ / *.js files
 * @static
 * @param  {String} filePath
 * @return {Boolean}
 */
ImageLoader.prototype.matchPath = function(filePath) {
  return re.test(filePath);
};


module.exports = ImageLoader;
