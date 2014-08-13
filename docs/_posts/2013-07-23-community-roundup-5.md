---
title: "Community Round-up #5"
author: Vjeux
---

We launched the [React Facebook Page](https://www.facebook.com/react) along with the React v0.4 launch. 700 people already liked it to get updated on the project :)

## Cross-browser onChange

[Ben Alpert](http://benalpert.com/) from [Khan Academy](https://www.khanacademy.org/) worked on a cross-browser implementation of `onChange` event that landed in v0.4. He wrote a blog post explaining the various browser quirks he had to deal with.

> First off, what is the input event? If you have an `<input>` element and want to receive events whenever the value changes, the most obvious thing to do is to listen to the change event. Unfortunately, change fires only after the text field is defocused, rather than on each keystroke. The next obvious choice is the keyup event, which is triggered whenever a key is released. Unfortunately, keyup doesn't catch input that doesn't involve the keyboard (e.g., pasting from the clipboard using the mouse) and only fires once if a key is held down, rather than once per inserted character.
>
> Both keydown and keypress do fire repeatedly when a key is held down, but both fire immediately before the value changes, so to read the new value you have to defer the handler to the next event loop using `setTimeout(fn, 0)` or similar, which slows down your app. Of course, like keyup, neither keydown nor keypress fires for non-keyboard input events, and all three can fire in cases where the value doesn't change at all (such as when pressing the arrow keys).
>
> [Read the full post...](http://benalpert.com/2013/06/18/a-near-perfect-oninput-shim-for-ie-8-and-9.html)


## React Samples

Learning a new library is always easier when you have working examples you can play with. [jwh](https://github.com/jhw) put many of them on his [react-samples Github repo](https://github.com/jhw/react-samples).

> Some simple examples with Facebook's React framework
>
> * Bootstrap action bar, modal and table [#1](https://rawgithub.com/jhw/react-samples/master/html/actionbar.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/bootstrap_actionbar.html),
> [#3](https://rawgithub.com/jhw/react-samples/master/html/bootstrap_modal.html),
> [#4](https://rawgithub.com/jhw/react-samples/master/html/bootstrap_striped_table.html)
> * Comments [#1](https://rawgithub.com/jhw/react-samples/master/html/comments1.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/comments2.html)
> * Data Table [#1](https://rawgithub.com/jhw/react-samples/master/html/datatable.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/datatable2.html),
> [#3](https://rawgithub.com/jhw/react-samples/master/html/datatable3.html),
> [#4](https://rawgithub.com/jhw/react-samples/master/html/datatable4.html),
> [#5](https://rawgithub.com/jhw/react-samples/master/html/datatable5.html)
> * Filter Bar [#1](https://rawgithub.com/jhw/react-samples/master/html/filterbar.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/filterbar2.html),
> [#3](https://rawgithub.com/jhw/react-samples/master/html/filterbar3.html),
> [#4](https://rawgithub.com/jhw/react-samples/master/html/filterbar4.html),
> [#5](https://rawgithub.com/jhw/react-samples/master/html/filterbar5.html)
> * Fundoo Rating [#1](https://rawgithub.com/jhw/react-samples/master/html/fundoo.html)
> * Line Char: [#1](https://rawgithub.com/jhw/react-samples/master/html/linechart.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/linechart2.html)
> * Multi tabs [#1](https://rawgithub.com/jhw/react-samples/master/html/multitabs.html)
> * Select [#1](https://rawgithub.com/jhw/react-samples/master/html/select.html)
> * Simple Tabs [#1](https://rawgithub.com/jhw/react-samples/master/html/simpletabs.html),
> [#2](https://rawgithub.com/jhw/react-samples/master/html/simpletabs2.html),
> [#3](https://rawgithub.com/jhw/react-samples/master/html/simpletabs3.html),
> [#4](https://rawgithub.com/jhw/react-samples/master/html/simpletabs4.html)
> * Toggle [#1](https://rawgithub.com/jhw/react-samples/master/html/toggle.html)


## React Chosen Wrapper

[Cheng Lou](https://github.com/chenglou) wrote a wrapper for the [Chosen](http://harvesthq.github.io/chosen/) input library called [react-chosen](https://github.com/chenglou/react-chosen). It took just 25 lines to be able to use jQuery component as a React one.

```javascript
React.renderComponent(
  <Chosen noResultsText="No result" value="Harvest" onChange={doSomething}>
    <option value="Facebook">Facebook</option>
    <option value="Harvest">Harvest</option>
  </Chosen>
, document.body);
```


## JSX and ES6 Template Strings

[Domenic Denicola](http://domenicdenicola.com/) wrote a slide deck about the great applications of ES6 features and one slide shows how we could use Template Strings to compile JSX at run-time without the need for a pre-processing phase.

<figure><iframe src="http://www.slideshare.net/slideshow/embed_code/24187146?rel=0&startSlide=36" width="600" height="356" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC;border-width:1px 1px 0;margin-bottom:5px" allowfullscreen webkitallowfullscreen mozallowfullscreen> </iframe></figure>


## React Presentation

[Tom Occhino](http://tomocchino.com/) and [Jordan Walke](https://github.com/jordwalke), React developers, did a presentation of React at Facebook Seattle's office. Check out the first 25 minutes for the presentation and the remaining 45 for a Q&A. I highly recommend you watching this video.

<figure><iframe width="650" height="400" src="//www.youtube.com/embed/XxVg_s8xAms" frameborder="0" allowfullscreen></iframe></figure>


## Docs

[Pete Hunt](http://www.petehunt.net/) rewrote the entirety of the docs for v0.4. The goal was to add more explanation about why we built React and what the best practices are.

> Guides
>
> * [Why React?](/react/docs/why-react.html)
> * [Displaying Data](/react/docs/displaying-data.html)
>   * [JSX in Depth](/react/docs/jsx-in-depth.html)
>   * [JSX Gotchas](/react/docs/jsx-gotchas.html)
> * [Interactivity and Dynamic UIs](/react/docs/interactivity-and-dynamic-uis.html)
> * [Multiple Components](/react/docs/multiple-components.html)
> * [Reusable Components](/react/docs/reusable-components.html)
> * [Forms](/react/docs/forms.html)
> * [Working With the Browser](/react/docs/working-with-the-browser.html)
>   * [More About Refs](/react/docs/more-about-refs.html)
> * [Tooling integration](/react/docs/tooling-integration.html)
> * [Reference](/react/docs/top-level-api.html)
