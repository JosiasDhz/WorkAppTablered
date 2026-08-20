let welcomePending = false;

export function markHomeWelcomePending(): void {
  welcomePending = true;
}

export function consumeHomeWelcomePending(): boolean {
  if (!welcomePending) return false;
  welcomePending = false;
  return true;
}
