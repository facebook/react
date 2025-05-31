# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React היא ספריית JavaScript לבניית ממשקי משתמש.

* **הצהרתיות:** React הופכת את תהליך יצירת ממשקי משתמש אינטראקטיביים לפשוט. עיצבו תצוגות פשוטות לכל מצב באפליקציה שלכם, ו-React תעדכן ותציג בצורה יעילה את הרכיבים הנכונים כאשר הנתונים שלכם משתנים. תצוגות הצהרתיות הופכות את הקוד שלכם ליותר צפוי, פשוט להבנה וקל לדיבוג.
* **מבוססת רכיבים:** בנו רכיבים מבודדים המנהלים את המצב שלהם בעצמם, ואז חברו אותם כדי ליצור ממשקי משתמש מורכבים. מכיוון שהלוגיקה של הרכיבים נכתבת ב-JavaScript ולא בתבניות, ניתן להעביר בקלות נתונים עשירים דרך האפליקציה ולשמור על המצב מחוץ ל-DOM.
* **למדו פעם אחת, כתבו בכל מקום:** אנחנו לא מניחים הנחות לגבי ערימת הטכנולוגיה שלכם, כך שתוכלו לפתח תכונות חדשות ב-React מבלי לשכתב קוד קיים. React יכולה גם להציג בצד השרת באמצעות [Node](https://nodejs.org/en) ולהפעיל אפליקציות מובייל באמצעות [React Native](https://reactnative.dev/).

[למדו כיצד להשתמש ב-React בפרויקט שלכם](https://react.dev/learn).

## התקנה

React עוצבה מראש כך שתתאים לשילוב הדרגתי, ו**ניתן להשתמש בה בכל היקף שתרצו:**

* השתמשו ב[התחלה מהירה](https://react.dev/learn) כדי להתנסות ב-React.
* [הוסיפו React לפרויקט קיים](https://react.dev/learn/add-react-to-an-existing-project) כדי להשתמש ב-React באופן חלקי או מלא.
* [צרו אפליקציית React חדשה](https://react.dev/learn/start-a-new-react-project) אם אתם מחפשים ערכת כלים עוצמתית ל-JavaScript.

## תיעוד

ניתן למצוא את התיעוד של React [באתר](https://react.dev/).

עיינו בעמוד [התחלה מהירה](https://react.dev/learn) לסקירה מהירה.

התיעוד מחולק למספר חלקים:

* [התחלה מהירה](https://react.dev/learn)
* [מדריך](https://react.dev/learn/tutorial-tic-tac-toe)
* [חשיבה ב-React](https://react.dev/learn/thinking-in-react)
* [התקנה](https://react.dev/learn/installation)
* [תיאור ממשק המשתמש](https://react.dev/learn/describing-the-ui)
* [הוספת אינטראקטיביות](https://react.dev/learn/adding-interactivity)
* [ניהול מצב](https://react.dev/learn/managing-state)
* [מדריכים מתקדמים](https://react.dev/learn/escape-hatches)
* [התייחסות ל-API](https://react.dev/reference/react)
* [איפה לקבל תמיכה](https://react.dev/community)
* [מדריך לתרומות](https://legacy.reactjs.org/docs/how-to-contribute.html)

ניתן לשפר את התיעוד באמצעות שליחת Pull Requests ל[מאגר הזה](https://github.com/reactjs/react.dev).

## דוגמאות

יש לנו מספר דוגמאות [באתר](https://react.dev/). הנה הראשונה כדי להתחיל:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

דוגמה זו תציג את "Hello Taylor" בתוך מיכל בדף.

תשימו לב שהשתמשנו בתחביר דמוי HTML; [אנחנו קוראים לזה JSX](https://react.dev/learn#writing-markup-with-jsx). JSX אינו נדרש לשימוש ב-React, אך הוא הופך את הקוד לקריא יותר, וכתיבתו מרגישה כמו כתיבת HTML.

## תרומות

המטרה המרכזית של מאגר זה היא להמשיך לפתח את הליבה של React, להפוך אותה למהירה וקלה יותר לשימוש. הפיתוח של React מתבצע בצורה פתוחה ב-GitHub, ואנחנו אסירי תודה לקהילה על תרומתם לתיקון באגים ושיפורים. קראו בהמשך כיצד תוכלו לקחת חלק בשיפור React.

### [קוד ההתנהגות](https://code.fb.com/codeofconduct)

פייסבוק אימצה קוד התנהגות שאנו מצפים שמשתתפי הפרויקט יעמדו בו. אנא קראו את [הטקסט המלא](https://code.fb.com/codeofconduct) כדי להבין אילו פעולות יתקבלו ואילו לא.

### [מדריך לתרומות](https://legacy.reactjs.org/docs/how-to-contribute.html)

קראו את [מדריך התרומות](https://legacy.reactjs.org/docs/how-to-contribute.html) כדי ללמוד על תהליך הפיתוח שלנו, כיצד להציע תיקוני באגים ושיפורים, וכיצד לבנות ולבדוק את השינויים שלכם ל-React.

### [בעיות למתחילים](https://github.com/facebook/react/labels/good%20first%20issue)

כדי לעזור לכם להתחיל ולהכיר את תהליך התרומה, יש לנו רשימה של [בעיות למתחילים](https://github.com/facebook/react/labels/good%20first%20issue) שכוללות באגים בהיקף מוגבל יחסית. זהו מקום מצוין להתחיל ממנו.

### רישיון

React היא תחת רישיון [MIT](./LICENSE).
