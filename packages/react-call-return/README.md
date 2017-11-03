# react-call-return

This is an experimental package for multi-pass rendering in React.

**Its API is not as stable as that of React, React Native, or React DOM, and does not follow the common versioning scheme.**

**Use it at your own risk.**

# No, Really, It Is Unstable

This is **an experiment**.

We **will** replace this with a different API in the future.  
It can break between patch versions of React.

We also know that **it has bugs**.

Don't rely on this for anything except experiments.  
Even in experiments, make sure to lock the versions so that an update doesn't break your app.

Don't publish third party components relying on this unless you clearly mark them as experimental too.  
They will break.

Have fun! Let us know if you find interesting use cases for it.

# API

See the test case in `src/__tests__/ReactCallReturn.js` for an example.

# What and Why

The API is not very intuitive right now, but [this is a good overview](https://cdb.reacttraining.com/react-call-return-what-and-why-7e7761f81843) of why it might be useful in some cases. We are very open to better API ideas for this concept.
