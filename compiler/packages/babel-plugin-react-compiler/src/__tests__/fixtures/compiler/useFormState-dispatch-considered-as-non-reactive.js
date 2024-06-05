import { useFormState } from "react-dom";

function Component() {
  const [formState, dispatchForm] = useFormState();
  const onSubmitForm = () => {
    dispatchForm();
  };
  return <Foo onSubmitForm={onSubmitForm} />;
}

function Foo() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};
