---
id: references-to-components-ko-KR
title: 컴포넌트 참조
layout: tips
permalink: references-to-components-ko-KR.html
prev: expose-component-functions-ko-KR.html
next: children-undefined-ko-KR.html
---

애플리케이션의 일부에서만 React 컴포넌트를 사용중이거나 코드를 React로 전환하고 있다면, 컴포넌트의 참조를 보존할 필요가 있을 것입니다. `React.render`는 마운트된 컴포넌트의 참조를 반환합니다:

```js
var myComponent = React.render(<MyComponent />, myContainer);
```

명심하세요, JSX는 컴포넌트 인스턴스를 반환하지 않습니다! 단지 마운트된 컴포넌트가 어떻게 보일지 알려주는 간단한 서술인 **ReactElement**일 뿐입니다.

```js
var myComponentElement = <MyComponent />; // ReactElement일 뿐입니다.

// 코드들이 여기 위치하게 됩니다...

var myComponentInstance = React.render(myComponentElement, myContainer);
```

> 주의:
>
> 이는 최상위 레벨에서만 사용되어야 합니다. 컴포넌트의 내부에서는 `prop`과 `state`가 자식컴포넌트와의 통신을 제어하며, [refs](/react/docs/more-about-refs-ko-KR.html)를 통해서만 컴포넌트를 참조할 수 있습니다.
