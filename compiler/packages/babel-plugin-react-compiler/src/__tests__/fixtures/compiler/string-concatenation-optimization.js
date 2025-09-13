/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function StringConcatenationComponent({name, suffix}) {
  // Test string concatenation optimization
  const greeting = "Hello, " + name + "!";
  const message = greeting + " " + suffix;
  
  // Test template literal optimization
  const templateMessage = `Welcome ${name}, ${suffix}`;
  
  // Test mixed concatenation
  const mixedMessage = "User: " + name + ` (${suffix})`;
  
  return (
    <div>
      <h1>{greeting}</h1>
      <p>{message}</p>
      <p>{templateMessage}</p>
      <p>{mixedMessage}</p>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: StringConcatenationComponent,
  params: [{name: "World", suffix: "Welcome to React Compiler"}],
  isComponent: true,
};
