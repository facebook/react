# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React هي مكتبة JavaScript لبناء واجهات المستخدم.

* **الإعلانية:** تجعل React إنشاء واجهات مستخدم تفاعلية أمرًا سهلاً. قم بتصميم واجهات بسيطة لكل حالة في تطبيقك، وستقوم React بتحديث وعرض المكونات الصحيحة عند تغيير بياناتك بكفاءة. تجعل الواجهات الإعلانية الكود الخاص بك أكثر توقعًا وأسهل للفهم وأسهل لإصلاح الأخطاء.
* **قائمة على المكونات:** قم بإنشاء مكونات مغلقة تدير حالتها الخاصة، ثم قم بتجميعها لإنشاء واجهات مستخدم معقدة. نظرًا لأن منطق المكونات مكتوب في JavaScript بدلاً من القوالب، يمكنك تمرير بيانات غنية بسهولة عبر تطبيقك والحفاظ على الحالة خارج DOM.
* **تعلم مرة واحدة، اكتب في أي مكان:** نحن لا نفترض أي شيء عن بقية تقنياتك، لذا يمكنك تطوير ميزات جديدة باستخدام React دون الحاجة إلى إعادة كتابة الكود الحالي. يمكن أيضًا لـ React العرض على الخادم باستخدام [Node](https://nodejs.org/en) وتشغيل تطبيقات الأجهزة المحمولة باستخدام [React Native](https://reactnative.dev/).

[تعرف على كيفية استخدام React في مشروعك](https://react.dev/learn).

## التثبيت

تم تصميم React لاعتماد تدريجي منذ البداية، و**يمكنك استخدامها بقدر ما تحتاج أو ترغب:**

* استخدم [البدء السريع](https://react.dev/learn) للحصول على فكرة عن React.
* [أضف React إلى مشروع قائم](https://react.dev/learn/add-react-to-an-existing-project) لاستخدام React جزئيًا أو بالكامل.
* [أنشئ تطبيق React جديد](https://react.dev/learn/start-a-new-react-project) إذا كنت تبحث عن مجموعة أدوات JavaScript قوية.

## الوثائق

يمكنك العثور على وثائق React [على الموقع الإلكتروني](https://react.dev/).

اطلع على صفحة [البدء السريع](https://react.dev/learn) لمحة عامة سريعة.

تنقسم الوثائق إلى عدة أقسام:

* [البدء السريع](https://react.dev/learn)
* [الدليل](https://react.dev/learn/tutorial-tic-tac-toe)
* [التفكير في React](https://react.dev/learn/thinking-in-react)
* [التثبيت](https://react.dev/learn/installation)
* [وصف واجهة المستخدم](https://react.dev/learn/describing-the-ui)
* [إضافة التفاعلية](https://react.dev/learn/adding-interactivity)
* [إدارة الحالة](https://react.dev/learn/managing-state)
* [الأدلة المتقدمة](https://react.dev/learn/escape-hatches)
* [مرجع API](https://react.dev/reference/react)
* [أين تحصل على الدعم](https://react.dev/community)
* [دليل المساهمة](https://legacy.reactjs.org/docs/how-to-contribute.html)

يمكنك تحسينه عن طريق إرسال طلبات السحب إلى [هذا المستودع](https://github.com/reactjs/react.dev).

## الأمثلة

لدينا العديد من الأمثلة [على الموقع الإلكتروني](https://react.dev/). إليك الأول لتبدأ:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

سيقوم هذا المثال بعرض "Hello Taylor" داخل حاوية على الصفحة.

لاحظ أننا استخدمنا بناء جملة يشبه HTML؛ [نسميه JSX](https://react.dev/learn#writing-markup-with-jsx). JSX ليس مطلوبًا لاستخدام React، لكنه يجعل الكود أكثر قابلية للقراءة، وكتابته يشبه كتابة HTML.

## المساهمة

الهدف الرئيسي من هذا المستودع هو الاستمرار في تطوير نواة React، مما يجعلها أسرع وأسهل في الاستخدام. يتم تطوير React علنًا على GitHub، ونحن ممتنون للمجتمع على مساهماتهم في إصلاح الأخطاء والتحسينات. اقرأ أدناه لتتعلم كيف يمكنك المشاركة في تحسين React.

### [مدونة السلوك](https://code.fb.com/codeofconduct)

اعتمدت Facebook مدونة سلوك نتوقع من المشاركين في المشروع الالتزام بها. يُرجى قراءة [النص الكامل](https://code.fb.com/codeofconduct) لتفهم ما هي الإجراءات المقبولة وغير المقبولة.

### [دليل المساهمة](https://legacy.reactjs.org/docs/how-to-contribute.html)

اقرأ [دليل المساهمة](https://legacy.reactjs.org/docs/how-to-contribute.html) لتتعلم عن عملية التطوير الخاصة بنا، وكيفية اقتراح إصلاحات الأخطاء والتحسينات، وكيفية بناء واختبار تغييراتك لـ React.

### [قضايا جيدة للمبتدئين](https://github.com/facebook/react/labels/good%20first%20issue)

لمساعدتك على البدء والتعرف على عملية المساهمة، لدينا قائمة بـ [القضايا الجيدة للمبتدئين](https://github.com/facebook/react/labels/good%20first%20issue) التي تحتوي على أخطاء ذات نطاق محدود نسبيًا. هذا مكان رائع للبدء.

### الرخصة

React مرخصة تحت [رخصة MIT](./LICENSE).
