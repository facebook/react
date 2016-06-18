var HelloWorldComponent = ng.core.Component({
  selector: 'hello-world',
  //template: 'hello world!!!'
  templateUrl: 'hello-world.html'
}).Class({
  constructor: function() {}
});



ng.platformBrowserDynamic.bootstrap(HelloWorldComponent);
