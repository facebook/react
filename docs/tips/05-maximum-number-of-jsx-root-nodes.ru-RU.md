---
id: maximum-number-of-jsx-root-nodes
title: Максимальное количество корневых JSX-узлов
layout: tips
permalink: tips/maximum-number-of-jsx-root-nodes-ru-RU.html
prev: self-closing-tag-ru-RU.html
next: style-props-value-px.html
---

В данный момент, метод `render` компонента позволяет вернуть только один узел. Если необходимо вернуть, например, несколько `div`, оберните их в `div`, `span` или любой другой компонент.

Следует помнить, что JSX компилируется в обычный JS; возвращение двух функций не имеет синтаксического смысла. Также не помещайте более одного дочернего элемента в тернарный оператор.
