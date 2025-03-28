import fbt from 'fbt';
import {Stringify} from 'shared-runtime';

/**
 * MemoizeFbtAndMacroOperands needs to account for nested fbt calls.
 * Expected fixture `fbt-param-call-arguments` to succeed but it failed with error:
 *   /fbt-param-call-arguments.ts: Line 19 Column 11: fbt: unsupported babel node: Identifier
 *   ---
 *   t3
 *   ---
 */
function Component({firstname, lastname}) {
  'use memo';
  return (
    <Stringify>
      {fbt(
        [
          'Name: ',
          fbt.param('firstname', <Stringify key={0} name={firstname} />),
          ', ',
          fbt.param(
            'lastname',
            <Stringify key={0} name={lastname}>
              {fbt('(inner fbt)', 'Inner fbt value')}
            </Stringify>
          ),
        ],
        'Name'
      )}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{firstname: 'first', lastname: 'last'}],
  sequentialRenders: [{firstname: 'first', lastname: 'last'}],
};
