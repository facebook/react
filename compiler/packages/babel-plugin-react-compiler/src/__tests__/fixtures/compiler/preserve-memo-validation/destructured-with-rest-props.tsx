import {useMemo} from 'react';

function useTheme() {
  return {primary: '#blue', secondary: '#green'};
}

function computeStyles(
  specialProp: string | undefined,
  restProps: any,
  theme: any,
) {
  return {
    color: specialProp ? theme.primary : theme.secondary,
    ...restProps.style,
  };
}

export function SpecialButton({
  specialProp,
  ...restProps
}: {
  specialProp?: string;
  style?: Record<string, string>;
  onClick?: () => void;
}) {
  const theme = useTheme();

  const styles = useMemo(
    () => computeStyles(specialProp, restProps, theme),
    [specialProp, restProps, theme],
  );

  return (
    <button style={styles} onClick={restProps.onClick}>
      Click me
    </button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: SpecialButton,
  params: [{specialProp: 'test', style: {fontSize: '16px'}, onClick: () => {}}],
  isComponent: true,
};
