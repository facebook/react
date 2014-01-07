if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'todolist from addItem to callback';

exports.defer = true;

exports.setup = function(){
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
  /*global*/_app = todolist.App({ fakeDataCount: 333 });
  React.renderComponent(_app, _rootNode);
};
exports.fn = function(deferred){
  var liCount = document.getElementsByTagName('li').length;
  _app.addItem(Math.random(), function(){
    if (document.getElementsByTagName('li').length <= liCount) throw Error('expected a list item to be added to the dom');
    deferred.resolve();
  });
};
exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
  _rootNode.parentNode.removeChild(_rootNode);
  _rootNode = null;
  _app = null;
};
