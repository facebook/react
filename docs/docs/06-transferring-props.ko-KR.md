---
id: transferring-props-ko-KR
title: Props 전달
permalink: transferring-props-ko-KR.html
prev: reusable-components-ko-KR.html
next: forms-ko-KR.html
---

React에서는 컴포넌트를 감싸서 추상화하는 것이 일반적인 패턴입니다. 외부 컴포넌트에서는 간단한 프로퍼티만을 노출하여 복잡한 세부 구현을 감출 수 있습니다.

[JSX 스프레드 어트리뷰트](/react/docs/jsx-spread-ko-KR.html)를 통해 props에 추가적인 값을 병합할 수 있습니다.

```javascript
<Component {...this.props} more="values" />
```

만약 JSX를 사용하지 않는다면 ES6의 `Object.assign`나 Underscore의 `_.extend` 같은 객체 헬퍼를 사용할 수 있습니다:

```javascript
React.createElement(Component, Object.assign({}, this.props, { more: 'values' }));
```

이 튜토리얼의 나머지 부분은 모범 답안을 소개할 것입니다. JSX와 실험적인 ES7 구문을 사용합니다.

## 수동적인 전달

대부분의 경우 명시적으로 프로퍼티를 아래로 전달해야 합니다. 이는 동작을 확신하는 내부 API의 일부만 공개하도록 합니다.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    <div className={fancyClass} onClick={props.onClick}>
      {props.children}
    </div>
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    세상아 안녕!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

하지만 `name`이나 `title`, `onMouseOver` 같은 prop들이 더 추가된다면 어떨까요?

## JSX에서 `...`를 사용해 전달하기

> 주의:
>
> `...` 구문은 객체 잔여 스프레드 제안의 일부입니다. 이 제안은 표준화 과정에 있습니다. 더 자세한 내용은 밑의 [잔여 프로퍼티와 스프레드 프로퍼티 ...](/react/docs/transferring-props.html#rest-and-spread-properties-...) 부분을 참고하세요.


때로는 모든 프로퍼티를 일일이 전달 하는것은 지루하고 덧없는 작업입니다. 이 경우 [구조 해체 할당(destructuring assignment)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)을 다른 프로퍼티를 함께 사용해 미상의 프로퍼티를 추출할 수 있습니다.

소비할 프로퍼티들을 나열하고, 그 뒤에 `...other`를 넣습니다.

```javascript
var { checked, ...other } = props;
```

이는 지금 소비한 props를 *제외한* 나머지를 아래로 전달합니다.

```javascript
function FancyCheckbox(props) {
  var { checked, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  // `other`에는 { onClick: console.log }가 포함되지만 checked 프로퍼티는 제외됩니다
  return (
    <div {...other} className={fancyClass} />
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    세상아 안녕!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

> 주의:
>
> 위의 예제에서는 `checked` prop 또한 마찬가지로 유효한 DOM 어트리뷰트입니다. 이런 식으로 구조의 해체(destructuring)를 하지 않으면 의도하지 않게 함께 전달될 수 있습니다.

미상의 `other` props을 전달할 때는 항상 구조 해체 패턴을 사용하세요.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  // 반례: `checked` 또한 내부 컴포넌트로 전달될 것입니다
  return (
    <div {...props} className={fancyClass} />
  );
}
```

## 같은 Prop을 소비하고 전달하기

컴포넌트가 프로퍼티를 사용하지만 계속 넘기길 원한다면, `checked={checked}`처럼 명시적으로 다시 넘길 수 있습니다. 리팩토링과 린트(lint)하기가 더 쉬우므로 이 방식이 `this.props` 객체 전부를 넘기는 것보다 낫습니다.

```javascript
function FancyCheckbox(props) {
  var { checked, title, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  var fancyTitle = checked ? 'X ' + title : 'O ' + title;
  return (
    <label>
      <input {...other}
        checked={checked}
        className={fancyClass}
        type="checkbox"
      />
      {fancyTitle}
    </label>
  );
}
```

> 주의:
>
> 순서는 중요합니다. `{...other}`를 JSX props 이전에 넣는 것으로 컴포넌트의 사용자가 확실히 그것들을 오버라이드 할 수 없게 합니다. 위의 예제에서는 input이 `"checkbox"` 타입인 것을 보장합니다.

<a name="rest-and-spread-properties-..."></a>
## 잔여 프로퍼티와 스프레드 프로퍼티 `...`

잔여(Rest, `...`) 프로퍼티는 객체에서 소비되지 않은 나머지 프로퍼티를 추출해 새로운 객체로 만들 수 있게 해 줍니다. 구조 해체 패턴에서 열거된 다른 프로퍼티들은 모두 제외됩니다.

이 제안은 2 단계에 돌입해 이제 바벨에서 기본값으로 활성화되어있습니다. 바벨의 이전 버전은 `babel --optional es7.objectRestSpread`로 명시적으로 활성화 할 필요가 있을 수도 있습니다.

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> 주의:
>
> 실험적인 ES7 구문을 활성화하려면 [JSX 커맨드라인 도구](https://www.npmjs.com/package/react-tools)를 `--harmony` 플래그와 함께 사용하세요.

## Underscore로 전달 다루기

JSX를 사용하지 않는다면 라이브러리를 사용해 같은 패턴을 쓸 수 있습니다. Underscore에서는 `_.omit`을 사용해 특정 프로퍼티를 제외하거나 `_.extend`를 사용해 새로운 객체로 프로퍼티를 복사할 수 있습니다.

```javascript
function FancyCheckbox(props) {
  var checked = props.checked;
  var other = _.omit(props, 'checked');
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    React.DOM.div(_.extend({}, other, { className: fancyClass }))
  );
}
```
