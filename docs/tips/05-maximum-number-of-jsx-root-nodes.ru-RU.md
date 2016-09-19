---
id: maximum-number-of-jsx-root-nodes
title: Максимальное количество корневых JSX-узлов
layout: tips
permalink: tips/maximum-number-of-jsx-root-nodes-ru-RU.html
prev: self-closing-tag-ru-RU.html
next: style-props-value-px.html
---

Из метода `render` компонента пока что можно вернуть только один узел. Если нужно вернуть, например, несколько `div`, оберните их в `div`, `span` или любой другой компонент.

Не забывайте, что JSX компилируется в обычный JS, и возвращение двух функций не имеет синтаксического смысла. Также не помещайте более одного дочернего элемента в тернарный оператор.
