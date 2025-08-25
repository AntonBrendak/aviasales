export async function enableMocking() {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'true') return;
    const { setupWorker } = await import('msw/browser');
    const { handlers } = await import('../../../infra/mocks/handlers');
    const worker = setupWorker(...handlers);
    return worker.start({ onUnhandledRequest: 'bypass' });
}