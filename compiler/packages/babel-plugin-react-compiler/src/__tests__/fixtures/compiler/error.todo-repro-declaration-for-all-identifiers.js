function Foo() {
  try {
    // NOTE: this fixture previously failed during LeaveSSA;
    // double-check this code when supporting value blocks in try/catch
    for (let i = 0; i < 2; i++) {}
  } catch {}
}
