# create-component-with-subscriptions

Below is an example showing how the container can be used:

```js
// This is an example functional component that subscribes to some values.
function ExampleComponent({
  examplePassThroughProperty,
  friendsList,
  userProfile
}) {
  // The rendered output of this component is not very important.
  // It just exists to show how the observed values are provided.
  // Properties not related to subscriptions are passed through as-is,
  // (e.g. examplePassThroughProperty).
}

// In the below example, "friendsList" mimics an RxJS BehaviorSubject,
// and "userProfile" mimics an event dispatcher (like a DOM element).
function getDataFor(subscribable, propertyName) {
  switch (propertyName) {
    case "friendsListSubject":
      return subscribable.getValue();
    case "userProfile":
      return subscribable.value;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

function subscribeTo(valueChangedCallback, subscribable, propertyName) {
  switch (propertyName) {
    case "friendsListSubject":
      // Return the subscription in this case; it's necessary to unsubscribe.
      return subscribable.subscribe(valueChangedCallback);
    case "userProfile":
      const onChange = () => valueChangedCallback(subscribable.value);
      subscribable.addEventListener(onChange);
      // Return the event handling callback, since it's required to unsubscribe.
      return onChange;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

function unsubscribeFrom(subscribable, propertyName, subscription) {
  switch (propertyName) {
    case "friendsListSubject":
      // Unsubscribe using the subscription rather than the subscribable.
      subscription.unsubscribe();
    case "userProfile":
      // In this case, 'subscription', is the event handler/function.
      subscribable.removeEventListener(subscription);
      break;
    default:
      throw Error(`Invalid subscribable, "${propertyName}", specified.`);
  }
}

// Map incoming subscriptions property names (e.g. friendsListSubject)
// to property names expected by our functional component (e.g. friendsList).
const subscribablePropertiesMap = {
  friendsListSubject: "friendsList",
  userProfile: "userProfile"
};

// Decorate our functional component with a subscriber component.
// This HOC will automatically manage subscriptions to the incoming props,
// and map them to subscribed values to be passed to the inner component.
// All other props will be passed through as-is.
export default createSubscribable(
  {
    getDataFor,
    subscribablePropertiesMap,
    subscribeTo,
    unsubscribeFrom
  },
  ExampleComponent
);

```