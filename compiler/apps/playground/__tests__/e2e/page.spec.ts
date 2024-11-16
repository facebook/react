/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@playwright/test';
import {encodeStore, type Store} from '../../lib/stores';

test.describe.configure({mode: 'parallel'});

function concat(data: Array<string>): string {
  return data.join('');
}
const DIRECTIVE_TEST_CASES = [
  {
    name: 'module-scope-use-memo',
    input: `'use memo';

const Header = () => {
  const handleClick = () => {
    console.log('Header clicked');
  };

  return <h1 onClick={handleClick}>Welcome to the App!</h1>;
};`,
  },
  {
    name: 'module-scope-use-no-memo',
    input: `'use no memo';

const Footer = () => {
  const handleMouseOver = () => {
    console.log('Footer hovered');
  };

  return <footer onMouseOver={handleMouseOver}>Footer Information</footer>;
};
`,
  },
  {
    name: 'function-scope-use-memo-function-declaration',
    input: `function App() {
  'use memo';
  
  function Sidebar() {
    const handleToggle = () => {
      console.log('Sidebar toggled');
    };

    return <aside onClick={handleToggle}>Sidebar Content</aside>;
  }

  const MemoizedSidebar = React.memo(Sidebar);

  function Content() {
    return <main>Main Content</main>;
  }

  const MemoizedContent = React.memo(Content);

  return (
    <div>
      <MemoizedSidebar />
      <MemoizedContent />
    </div>
  );
}`,
  },
  {
    name: 'function-scope-use-no-memo-function-expression',
    input: `const Dashboard = function() {
  'use no memo';
  const Widget = function() {
    const handleExpand = () => {
      console.log('Widget expanded');
    };

    return <div onClick={handleExpand}>Widget Content</div>;
  };

  const Panel = function() {
    return <section>Panel Information</section>;
  };

  return (
    <div>
      <Widget />
      <Panel />
    </div>
  );
};`,
  },
  {
    name: 'function-scope-use-memo-arrow-function-expression',
    input: `const Analytics = () => {
  'use memo';

  const Chart = () => {
    const handleRefresh = () => {
      console.log('Chart refreshed');
    };

    return <div onClick={handleRefresh}>Chart Content</div>;
  };

  const MemoizedChart = React.memo(Chart);

  const Graph = () => {
    return <div>Graph Content</div>;
  };

  const MemoizedGraph = React.memo(Graph);

  return (
    <div>
      <MemoizedChart />
      <MemoizedGraph />
    </div>
  );
};`,
  },
  {
    name: 'module-scope-use-no-memo-function-expression',
    input: `'use no memo';

const Sidebar = function() {
  return <aside>Sidebar Information</aside>;
};`,
  },
  {
    name: 'function-scope-no-directive-arrow-function-expression',
    input: `
const Profile = () => {
'use no memo';
  const Avatar = () => {
    return <div>Avatar Content</div>;
  };

  const MemoizedAvatar = React.memo(Avatar);

  const Bio = () => {
    const handleBioUpdate = () => {
      console.log('Bio updated');
    };

    return <div onClick={handleBioUpdate}>Bio Content</div>;
  };

  const MemoizedBio = React.memo(Bio);

  return (
    <div>
      <MemoizedAvatar />
      <MemoizedBio />
    </div>
  );
};`,
  },
  {
    name: 'function-scope-use-no-memo-function-declaration',
    input: `'use no memo';

function Settings() {
  'use memo';

  function Preferences() {
    const handleSave = () => {
      console.log('Preferences saved');
    };

    return <div onClick={handleSave}>Preferences Content</div>;
  }

  function Notifications() {
    return <div>Notifications Settings</div>;
  }

  return (
    <div>
      <Preferences />
      <Notifications />
    </div>
  );
}`,
  },
];
test('editor should open successfully', async ({page}) => {
  await page.goto(`/`, {waitUntil: 'networkidle'});
  await page.screenshot({
    fullPage: true,
    path: 'test-results/00-fresh-page.png',
  });
});
test('editor should compile from hash successfully', async ({page}) => {
  const store: Store = {
    source: `export default function TestComponent({ x }) {
      return <Button>{x}</Button>;
    }
    `,
  };
  const hash = encodeStore(store);
  await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});

  // User input from hash compiles
  await page.screenshot({
    fullPage: true,
    path: 'test-results/01-compiles-from-hash.png',
  });
  const userInput =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  expect(concat(userInput)).toMatchSnapshot('01-user-output.txt');
});
test('reset button works', async ({page}) => {
  const store: Store = {
    source: `export default function TestComponent({ x }) {
      return <Button>{x}</Button>;
    }
    `,
  };
  const hash = encodeStore(store);
  await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});

  // Reset button works
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', {name: 'Reset'}).click();
  await page.screenshot({
    fullPage: true,
    path: 'test-results/02-reset-button-works.png',
  });
  const defaultInput =
    (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
  expect(concat(defaultInput)).toMatchSnapshot('02-default-output.txt');
});
DIRECTIVE_TEST_CASES.forEach((t, idx) =>
  test(`directives work: ${t.name}`, async ({page}) => {
    const store: Store = {
      source: t.input,
    };
    const hash = encodeStore(store);
    await page.goto(`/#${hash}`, {waitUntil: 'networkidle'});
    await page.screenshot({
      fullPage: true,
      path: `test-results/03-0${idx}-${t.name}.png`,
    });

    const useMemoOutput =
      (await page.locator('.monaco-editor').nth(1).allInnerTexts()) ?? [];
    expect(concat(useMemoOutput)).toMatchSnapshot(`${t.name}-output.txt`);
  }),
);
