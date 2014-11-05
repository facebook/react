if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'From setState to callback (x5)';

exports.defer = true;

exports.setup = function(){
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
  /*global*/setState = null;

  var AwesomeComponent = React.createClass({
    getInitialState: function(){
      return { random:null };
    },
    render: function(){
      if (!setState) setState = this.setState.bind(this);
      return React.DOM.div(null, this.state.random);
    }
  });

  React.render(AwesomeComponent(null), _rootNode);
};
exports.fn = function(deferred){
  setState({random: Date.now() + Math.random()}, function(){
    setState({random: Date.now() + Math.random()}, function(){
      setState({random: Date.now() + Math.random()}, function(){
        setState({random: Date.now() + Math.random()}, function(){
          setState({random: Date.now() + Math.random()}, function(){
            deferred.resolve();
          });
        });
      });
    });
  });
};
exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
};
