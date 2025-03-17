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
