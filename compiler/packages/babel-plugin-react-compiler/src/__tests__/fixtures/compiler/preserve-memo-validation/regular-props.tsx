import {useMemo} from 'react';

function useSession() {
  return {user: {userCode: 'ABC123'}};
}

function getDefaultFromValue(
  defaultValues: string | undefined,
  userCode: string,
) {
  return defaultValues ? `${defaultValues}-${userCode}` : userCode;
}

export function UpSertField(props: {defaultValues?: string}) {
  const {
    user: {userCode},
  } = useSession();

  const defaultValues = useMemo(
    () => getDefaultFromValue(props.defaultValues, userCode),
    [props.defaultValues, userCode],
  );

  return <div>{defaultValues}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: UpSertField,
  params: [{defaultValues: 'test'}],
  isComponent: true,
};
