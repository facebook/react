function Component(props) {
  const logEvent = useLogging(props.appId);
  const [currentStep, setCurrentStep] = useState(0);

  const onSubmit = (errorEvent) => {
    // 2. onSubmit inherits the mutable range of logEvent
    logEvent(errorEvent);
    // 3. this call then triggers the ValidateNoSetStateInRender check incorrectly, even though
    //    onSubmit is not called during render (although it _could_ be, if OtherComponent does so.
    //    but we can't tell without x-file analysis)
    setCurrentStep(1);
  };

  switch (currentStep) {
    case 0:
      return <OtherComponent data={{ foo: "bar" }} />;
    case 1:
      return <OtherComponent data={{ foo: "joe" }} onSubmit={onSubmit} />;
    default:
      // 1. logEvent's mutable range is extended to this instruction
      logEvent("Invalid step");
      return <OtherComponent data={null} />;
  }
}
