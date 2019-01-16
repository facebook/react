// This is a testing playground for our lint rules.

// 1. Run yarn && yarn start
// 2. "File > Add Folder to Workspace" this specific folder in VSCode with ESLint extension
// 3. Changes to the rule source should get picked up without restarting ESLint server

function Foo() {
  if (condition) {
    useEffect(() => {});
  }
}
