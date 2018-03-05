# create-component-with-subscriptions

Better docs coming soon...

```js
// Here is an example of using the subscribable HOC.
// It shows a couple of potentially common subscription types.
function ExampleComponent(props: Props) {
  const {
    observedValue,
    relayData,
    scrollTop,
  } = props;

  // The rendered output is not interesting.
  // The interesting thing is the incoming props/values.
}

function getDataFor(subscribable, propertyName) {
  switch (propertyName) {
    case 'fragmentResolver':
      return subscribable.resolve();
    case 'observableStream':
      // This only works for some observable types (e.g. BehaviorSubject)
      // It's okay to just return null/undefined here for other types.
      return subscribable.getValue();
    case 'scrollTarget':
      return subscribable.scrollTop;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

function subscribeTo(valueChangedCallback, subscribable, propertyName) {
  switch (propertyName) {
    case 'fragmentResolver':
      subscribable.setCallback(
        () => valueChangedCallback(subscribable.resolve()
      );
      break;
    case 'observableStream':
      // Return the subscription; it's necessary to unsubscribe.
      return subscribable.subscribe(valueChangedCallback);
    case 'scrollTarget':
      const onScroll = () => valueChangedCallback(subscribable.scrollTop);
      subscribable.addEventListener(onScroll);
      return onScroll;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

function unsubscribeFrom(subscribable, propertyName, subscription) {
  switch (propertyName) {
    case 'fragmentResolver':
      subscribable.dispose();
      break;
    case 'observableStream':
      // Unsubscribe using the subscription rather than the subscribable.
      subscription.unsubscribe();
    case 'scrollTarget':
      // In this case, 'subscription', is the event handler/function.
      subscribable.removeEventListener(subscription);
      break;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

// 3: This is the component you would export.
createSubscribable({
  subscribablePropertiesMap: {
    fragmentResolver: 'relayData',
    observableStream: 'observedValue',
    scrollTarget: 'scrollTop',
  },
  getDataFor,
  subscribeTo,
  unsubscribeFrom,
}, ExampleComponent);
```