function Component(props) {
  const { buttons } = props;
  const [primaryButton, ...nonPrimaryButtons] = buttons;

  const renderedNonPrimaryButtons = nonPrimaryButtons.map((buttonProps, i) => (
    <Button
      {...buttonProps}
      key={`button-${i}`}
      style={
        i % 2 === 0 ? styles.leftSecondaryButton : styles.rightSecondaryButton
      }
    />
  ));

  return <View>{renderedNonPrimaryButtons}</View>;
}

const styles = {
  leftSecondaryButton: { left: true },
  rightSecondaryButton: { right: true },
};

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      buttons: [
        {},
        { type: "submit", children: ["Submit!"] },
        { type: "button", children: ["Reset"] },
      ],
    },
  ],
};
