// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function useSupportsTouchEvent() {
  return useMemo(() => {
    if (checkforTouchEvents) {
      try {
        document.createEvent("TouchEvent");
        return true;
      } catch {
        return false;
      }
    }
  }, []);
}
