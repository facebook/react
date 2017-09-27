---
id: acknowledgements
title: Acknowledgements
layout: single
permalink: acknowledgements.html
---

We'd like to thank all of our contributors:

<div class="three-column">
  {% for author_col in site.data.acknowledgements %}
  <ul>
    {% for author in author_col %}
    <li>{{ author }}</li>
    {% endfor %}
  </ul>
  {% endfor %}
</div>

In addition, we're grateful to
 - [Jeff Barczewski](https://github.com/jeffbski) for allowing us to use the [react](https://www.npmjs.com/package/react) package name on npm.
 - [Christopher Aue](http://christopheraue.net/) for letting us use the [reactjs.com](http://reactjs.com/) domain name and the [@reactjs](https://twitter.com/reactjs) username on Twitter.
 - [ProjectMoon](https://github.com/ProjectMoon) for letting us use the [flux](https://www.npmjs.com/package/flux) package name on npm.
 - Shane Anderson for allowing us to use the [react](https://github.com/react) org on GitHub.
 - [Dmitri Voronianski](https://github.com/voronianski) for letting us use the [Oceanic Next](https://labs.voronianski.com/oceanic-next-color-scheme/) color scheme on this website.
