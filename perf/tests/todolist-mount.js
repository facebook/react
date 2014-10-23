if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'todolist from renderComponent to renderComponent callback (333 rows)';

exports.defer = true;

exports.setup = function(){
  if (typeof _rootNode != 'undefined') throw Error("should teardown before running setup again");
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
};

exports.fn = function(deferred){
  React.render(todolist.App({ fakeDataCount: 333 }), _rootNode, function(){ deferred.resolve(); });
};

exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
  _rootNode.parentNode.removeChild(_rootNode);
  _rootNode = undefined;
};
