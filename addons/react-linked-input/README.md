# react-linked-input

>**Note:**
>This is a legacy React addon, and is no longer maintained.
>
>We don't encourage using it in new code, but it exists for backwards compatibility.  
>The recommended migration path is to set `value` and `onChange` props directly instead of `valueLink` or `checkedLink`.

This component supports the legacy `valueLink` API for `<input>` components. The built-in support for it is being removed from React. This component may be used as a migration plan (so your code doesn't break in React 16) or may be used if you just like the `valueLink` data binding semantics. However, this component is not maintained, so use at your own risk.

For details on how to use it, refer to the [`LinkedStateMixin`](https://www.npmjs.com/package/react-addons-linked-state-mixin) documentation, since they usually appear together.
