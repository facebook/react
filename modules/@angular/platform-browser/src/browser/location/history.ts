export function supportsState(): boolean {
  return !!window.history.pushState;
}