# Zones

A Zone is an execution context that persists across async tasks. You can think of it as thread-local storage for
JavaScript. Zones are used to intercept all async operation callbacks in the browser. By intercepting async
callbacks Angular can automatically execute the change detection at the end of the VM turn to update the application
UI bindings. Zones means that in Angular v2 you don't have to remember to call `rootScope.$apply()` in your async call.

## Execution Context

```
zone.inTheZone = false;

zone.fork().run(function () {
  zone.inTheZone = true;

  setTimeout(function () {
    console.log('async in the zone: ' + zone.inTheZone);
  }, 0);
});

console.log('sync in the zone: ' + zone.inTheZone);
```

The above will log:

```
sync in the zone: false
async in the zone: true
```

In the above example the `zone` is a global-callback-local variable. To the `zone`  we can attach arbitrary properties
such as `inTheZone`.  When we enter the zone, we get a new `zone` context (which inherits all properties from the
parent zone), once we leave the zone, the previous `zone` variable is restored. The key part is that when a async
callback is scheduled in the zone, as is the case with `setTimeout`, the current `zone` variable is captured and
restored on the callback. This is why the output of the `inTheZone` property inside the callback of the `setTimeout`
prints `true`.


## Callback Interception

In addition to storing properties on the current `zone`, zones can also allow us to intercept all async callbacks
and notify us before and after the callback executes.

```
zone.fork({
  afterTask: function () {
    // do some cleanup
  }
}).run(function () {
  // do stuff
});
```

The above example will execute the `afterTask` function not only after the `run` finishes, but also after any callback
execution which was registered in the `run` block.

## Putting it all together in Angular

In Angular2 it is not necessary to notify Angular of changes manually after async callback, because a relevant
async callbacks are intercepted. The question is how do we know which callbacks are Angular relevant?

// TODO(vicb): outdated, rework.

```
/// Some other code running on page can do async operation
document.addEventListener('mousemove', function () {
  console.log('Mouse moved.');
});

var AngularZone = {
  afterTask: function () {
    console.log('ANGULAR AUTO-DIGEST!');
  }
};

var ngZone = zone.fork(AngularZone);
ngZone.run(function() {
  console.log('I aware of angular, I should cause digest.');
  document.addEventListener('click', function () {
    console.log('Mouse clicked.');
  });
});
```

Will produce:

```
I aware of angular, I should cause digest.
ANGULAR AUTO-DIGEST!
```

Moving the mouse will produce many:
```
Mouse moved.
```

But clicking will produce:
```
Mouse clicked.
ANGULAR AUTO-DIGEST!
```

Notice how the place where the listener was registered will effect whether or not Angular will be notified of the
async call and cause a change detection to run to update the UI.

Being able to globally intercept the async operation is important to have a seamless integration with all existing
libraries. But it is equally important to be able to differentiate between Angular and non-Angular code running
on the same page concurrently.
