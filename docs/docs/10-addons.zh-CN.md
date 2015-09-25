---
id: addons-zh-CN
title: 插件
permalink: addons-zh-CN.html
prev: tooling-integration-zh-CN.html
next: animation-zh-CN.html
---

`React.addons` 是我们放置一些用来构建React apps的有用的工具的地方。 **这些应该被认为是实验性的** 但是最终批量进入核心代码或者一个有用的工具库中:

- [`TransitionGroup` 和 `CSSTransitionGroup`](animation.html), 用来处理通常不能简单实现的动画和转换，比如在组件移除之前。 
- [`LinkedStateMixin`](two-way-binding-helpers.html), 简化用户的表单输入数据与组件状态的协调。 
- [`cloneWithProps`](clone-with-props.html), 创建React组件的浅拷贝并改变它们的props。 
- [`createFragment`](create-fragment.html), 创建一组外键的子级。
- [`update`](update.html), 一个使不可变数据在JavaScript里更易处理的辅助函数。 
- [`PureRenderMixin`](pure-render-mixin.html), 一个特定情况下的性能优化器。

下面的插件只存在开发版(未压缩)React中：

- [`TestUtils`](test-utils.html), 用于写测试用例的简单的辅助工具（仅存在于未压缩版本）。
- [`Perf`](perf.html), 用于测量性能并给你提示哪里可以优化。 

要获取插件，使用 `react-with-addons.js` (和它的压缩副本）而不是通常的 `react.js`。

当从npm使用react包时，简单的用`require('react/addons')` 代替 `require('react')` 来获取带有所有插件的React。
