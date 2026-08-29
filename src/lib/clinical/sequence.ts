export function shouldApplySequence(incoming: number, applied: number): boolean {
  return incoming >= applied;
}
