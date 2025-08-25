export const flags = {
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
  enableSSE: false,
  pollIntervalMs: 1000
} as const;