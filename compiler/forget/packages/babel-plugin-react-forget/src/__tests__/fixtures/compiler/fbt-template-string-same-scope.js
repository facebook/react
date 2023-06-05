import fbt from "fbt";

export function Component(props) {
  let count = 0;
  if (props.items) {
    count = props.items.length;
  }
  return (
    <View>
      {fbt(
        `for ${fbt.param("count", count)} experiences`,
        `Label for the number of items`,
        { project: "public" }
      )}
    </View>
  );
}
