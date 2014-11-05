if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

/*global*/_timesToRun = 2;

exports.name = 'todolist add, complete, remove (x' + _timesToRun + ')';

exports.defer = true;

exports.setup = function(){
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
  var appDescriptor = todolist.App({ fakeDataCount: 333 });
  /*global*/_app = React.render(appDescriptor, _rootNode);
};

exports.fn = function(deferred){
  var originalLiCount = document.getElementsByTagName('li').length;

  var todos = [];
  var times = _timesToRun;
  while (times-- >= 0){
    todos.push(_app.addItem(times+1));
  }

  todos.forEach(function(todo){
    _app.setItemCompleted(todo.id);
  });

  todos.forEach(function(todo){
    _app.deleteItemById(todo.id);
  });

  todos = null;

  _app.addItem(Math.random(), function(todo){
    if (document.getElementsByTagName('li').length <= originalLiCount)
      throw Error('expected a list item to be added to the dom');

    _app.deleteItemById(todo.id, function(){
      if (document.getElementsByTagName('li').length != originalLiCount)
        throw Error('expected everything to be done by now');
      deferred.resolve();
    });
  });
};

exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
  _rootNode.parentNode.removeChild(_rootNode);
  _rootNode = null;
  _app = null;
};
