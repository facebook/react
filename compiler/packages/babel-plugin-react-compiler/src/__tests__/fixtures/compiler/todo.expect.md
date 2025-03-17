
## Input

```javascript
// @flow
component AdvancedAnalyticsTableSchemaChangeCommentsModal(
  editingColumn: ?string,
  editingColumnValue: ?string,
  onClose: () => void,
  setEditingColumnValue: (?string) => void,
  table$key: AdvancedAnalyticsTableSchemaChangeCommentsModal_data$key
) renders GeoModal {
  const env = useRelayEnvironment();
  const table = useFragment('', table$key);

  const onSubmitChange = useMemo(() => {
    return () => {
      commitMutation(env, [table.__typename, table.id]);
    };
  }, [editingColumn, editingColumnValue, env, onClose, table]);

  return <GeoModal footer={onSubmitChange} />;
}

// import {useEffect} from 'react';
// import {makeArray} from 'shared-runtime';

// export default function MyApp({arr}) {
//   const cb = () => arr.length;
//   return <Child cb={() => cb()} />;
// }

// function MyApp1({arr}) {
//   const cb = () => (cond ? arr.length : 0);
//   return <Child cb={() => cb()} />;
// }

// function MyApp2({arr}) {
//   const cb = () => arr.length;
//   return <Child cb={() => cond ?? cb()} />;
// }
// // function useFoo({a}) {
// //   useEffect(() => {
// //     log(a.b.c);
// //   });
// //   const arr = makeArray();
// //   if (cond) {
// //     arr.push(a.b.c);
// //   }
// //   return arr;
// // }

4;

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function AdvancedAnalyticsTableSchemaChangeCommentsModal(t0) {
  const $ = _c(6);
  const { editingColumn, editingColumnValue, onClose, table$key } = t0;

  const env = useRelayEnvironment();
  const table = useFragment("", table$key);
  let t1;
  let t2;
  if ($[0] !== env || $[1] !== table.__typename || $[2] !== table.id) {
    t2 = () => {
      commitMutation(env, [table.__typename, table.id]);
    };
    $[0] = env;
    $[1] = table.__typename;
    $[2] = table.id;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  t1 = t2;
  const onSubmitChange = t1;
  let t3;
  if ($[4] !== onSubmitChange) {
    t3 = <GeoModal footer={onSubmitChange} />;
    $[4] = onSubmitChange;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

4;

```
      
### Eval output
(kind: exception) Fixture not implemented