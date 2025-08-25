import { onCLS, onFID, onLCP, onINP } from 'web-vitals/attribution';


const endpoint = process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics';


export function reportWebVitalsToOTel() {
    const send = (name: string, value: number) => {
        // Упрощённо: отправляем как beacon/POST (реальный OTel SDK подключим в Phase 9)
        navigator.sendBeacon?.(
            endpoint,
            JSON.stringify({ name, value, ts: Date.now(), app: 'web' })
        );
    };
    onLCP(v => send('LCP', v.value));
    onINP(v => send('INP', v.value));
    onCLS(v => send('CLS', v.value));
    onFID(v => send('FID', v.value));
}