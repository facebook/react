if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'todolist setItemCompleted';

exports.defer = true;

exports.setup = function(){
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
  var appDescriptor = todolist.App({ fakeDataCount: 333 });
  /*global*/_app = React.render(appDescriptor, _rootNode);
  /*global*/_todo1 = _app.addItem("Howdy 1!");
  /*global*/_todo2 = _app.addItem("Howdy 2!");
  /*global*/_todo3 = _app.addItem("Howdy 3!");
};

exports.fn = function(deferred){
  _app.setItemCompleted(_todo1.id, !_todo1.completed);
  _app.setItemCompleted(_todo2.id, !_todo2.completed);
  _app.setItemCompleted(_todo3.id, !_todo3.completed, function(){
    deferred.resolve();
  });
};

exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
  _rootNode.parentNode.removeChild(_rootNode);
  _rootNode = null;
  _app = null;
};
