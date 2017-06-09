---
title: "Community Round-up #7"
author: vjeux
---

It's been three months since we open sourced React and it is going well. Some stats so far:

* 114 285 unique visitors on this website
* [1933 stars](https://github.com/facebook/react/stargazers) and [210 forks](https://github.com/facebook/react/network/members)
* [226 posts on Google Group](https://groups.google.com/forum/#!forum/reactjs)
* [76 GitHub projects using React](https://gist.github.com/vjeux/6335762)
* [30 contributors](https://github.com/facebook/react/graphs/contributors)
* [15 blog posts](/react/blog/)
* 2 early adopters: [Khan Academy](http://benalpert.com/2013/06/09/using-react-to-speed-up-khan-academy.html) and [Propeller](http://usepropeller.com/blog/posts/from-backbone-to-react/)


## Wolfenstein Rendering Engine Ported to React

[Pete Hunt](http://www.petehunt.net/) ported the render code of the web version of Wolfenstein 3D to React. Check out [the demo](http://www.petehunt.net/wolfenstein3D-react/wolf3d.html) and [render.js](https://github.com/petehunt/wolfenstein3D-react/blob/master/js/renderer.js#L183) file for the implementation.
<figure>[![](/react/img/blog/wolfenstein_react.png)](http://www.petehunt.net/wolfenstein3D-react/wolf3d.html)</figure>


## React & Meteor

[Ben Newman](https://twitter.com/benjamn) made a [13-lines wrapper](https://github.com/benjamn/meteor-react/blob/master/lib/mixin.js) to use React and Meteor together. [Meteor](http://www.meteor.com/) handles the real-time data synchronization between client and server. React provides the declarative way to write the interface and only updates the parts of the UI that changed.

> This repository defines a Meteor package that automatically integrates the React rendering framework on both the client and the server, to complement or replace the default Handlebars templating system.
>
> The React core is officially agnostic about how you fetch and update your data, so it is far from obvious which approach is the best. This package provides one answer to that question (use Meteor!), and I hope you will find it a compelling combination.
>
>```javascript
>var MyComponent = React.createClass({
>  mixins: [MeteorMixin],
>
>  getMeteorState: function() {
>    return { foo: Session.get('foo') };
>  },
>
>  render: function() {
>    return <div>{this.state.foo}</div>;
>  }
>});
>```
>
> Dependencies will be registered for any data accesses performed by getMeteorState so that the component can be automatically re-rendered whenever the data changes.
>
> [Read more ...](https://github.com/benjamn/meteor-react)

## React Page

[Jordan Walke](https://github.com/jordwalke) implemented a complete React project creator called [react-page](https://github.com/facebook/react-page/). It supports both server-side and client-side rendering, source transform and packaging JSX files using CommonJS modules, and instant reload.

> Easy Application Development with React JavaScript
> <figure>[![](/react/img/blog/react-page.png)](https://github.com/facebook/react-page/)</figure>
>
> **Why Server Rendering?**
>
> * Faster initial page speed:
>   * Markup displayed before downloading large JavaScript.
>   * Markup can be generated more quickly on a fast server than low power client devices.
> * Faster Development and Prototyping:
>   * Instantly refresh your app without waiting for any watch scripts or bundlers.
> * Easy deployment of static content pages/blogs: just archive using recursive wget.
> * SEO benefits of indexability and perf.
>
> **How Does Server Rendering Work?**
>
> * `react-page` computes page markup on the server, sends it to the client so the user can see it quickly.
> * The corresponding JavaScript is then packaged and sent.
> * The browser runs that JavaScript, so that all of the event handlers, interactions and update code will run seamlessly on top of the server generated markup.
> * From the developer's (and the user's) perspective, it's just as if the rendering occurred on the client, only faster.
>
> [Try it out ...](https://github.com/facebook/react-page/)
