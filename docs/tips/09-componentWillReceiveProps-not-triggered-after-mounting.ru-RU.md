---
id: componentWillReceiveProps-not-triggered-after-mounting-ru-RU
title: componentWillReceiveProps не срабатывает после появления компонента
layout: tips
permalink: tips/componentWillReceiveProps-not-triggered-after-mounting.html
prev: controlled-input-null-value-ru-RU.html
next: props-in-getInitialState-as-anti-pattern.html
---

Метод `componentWillReceiveProps` не вызывается после появления компонента. Это определено дизайном. Используйте [другой метод жизненного цикла](/react/docs/component-specs.html), который подходит для вашей ситуации.

Причина в том что `componentWillReceiveProps` часто используется для сравнения предыдущих и новых значений свойств, чтобы отреагировать на их изменения. Не выполнение этого метода после появления компонента (когда предыдущих свойств еще нет) дает лучшее понимание того что делает этот метод.
