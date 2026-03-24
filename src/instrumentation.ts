export async function register() {
  // Triggers env validation — app crashes with a clear message if vars are missing
  await import('@/shared/env');
}
