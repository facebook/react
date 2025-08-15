// @validatePreserveExistingMemoizationGuarantees @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
import { useRef, useEffect, useCallback } from 'react';

export default function MyApp() {
  const requestRef = useRef(null);

  // Self-referencing callback - animate references itself inside the callback
  const animate = useCallback((time) => {
    console.log(Math.random() + time);
    // Using setTimeout as a more portable example than requestAnimationFrame
    requestRef.current = setTimeout(() => animate(Date.now()), 16);
  }, []);

  // Start the render loop
  useEffect(() => {
    requestRef.current = setTimeout(() => animate(Date.now()), 16);
    return () => { 
      if (requestRef.current) {
        clearTimeout(requestRef.current); 
      }
    };
  }, [animate]);

  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyApp,
  params: [],
};