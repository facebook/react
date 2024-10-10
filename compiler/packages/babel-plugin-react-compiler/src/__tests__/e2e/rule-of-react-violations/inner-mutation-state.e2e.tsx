/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {render, fireEvent} from '@testing-library/react';
import * as React from 'react';
import {useState} from 'react';

type Data = {
  isDataFetched: boolean;
  fieldData: {
    username: {
      errorMessage: string | null;
      value: string | null;
    };
    address: {
      errorMessage: string | null;
      value: string | null;
    };
  };
};
function useRoRViolation(): [
  Data,
  (
    field: 'username' | 'address',
    kind: 'errorMessage' | 'value',
    newValue: string,
  ) => void,
] {
  'use no forget';
  const [count, setCount] = useState<number>(0);
  const [state, setState] = useState<Data>({
    isDataFetched: false,
    fieldData: {
      username: {
        errorMessage: null,
        value: null,
      },
      address: {
        errorMessage: null,
        value: null,
      },
    },
  });
  const update = (
    field: 'username' | 'address',
    kind: 'errorMessage' | 'value',
  ) => {
    setState((prevState: Data) => {
      const newState = {...prevState};
      const data =
        field === 'username'
          ? newState.fieldData.username
          : newState.fieldData.address;
      if (kind === 'errorMessage') {
        data.errorMessage = `value${count}`;
      } else {
        data.errorMessage = `value${count}`;
      }
      return newState;
    });
    setCount(count + 1);
  };

  return [state, update];
}

function Component({
  label,
  showFields,
}: {
  label: keyof Data['fieldData'];
  showFields: boolean;
}) {
  const [state, update] = useRoRViolation();
  function readState(label: keyof Data['fieldData']) {
    return state.fieldData[label];
  }
  const field = readState(label);
  return (
    <>
      {showFields ? (
        <div>
          {field.errorMessage ?? '(none)'} {field.value ?? '(none)'}
        </div>
      ) : (
        <div>no data</div>
      )}
      <button
        data-testid="state_update"
        onClick={() => update(label, 'errorMessage', 'new value')}></button>
    </>
  );
}

test('update-button', () => {
  const label: 'username' = 'username';
  const {asFragment, rerender, getByTestId} = render(
    <Component label={label} showFields={true} />,
  );

  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div>
        (none) (none)
      </div>
      <button
        data-testid="state_update"
      />
    </DocumentFragment>
  `);

  fireEvent.click(getByTestId('state_update'));

  if (__FORGET__) {
    /**
     * Now we have a reactivity bug due to a rule-of-react violation!
     */
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          (none) (none)
        </div>
        <button
          data-testid="state_update"
        />
      </DocumentFragment>
    `);
  } else {
    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          value0 (none)
        </div>
        <button
          data-testid="state_update"
        />
      </DocumentFragment>
    `);
  }
});
