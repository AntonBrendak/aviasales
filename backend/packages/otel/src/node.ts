import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';

let sdk: NodeSDK | undefined;

export async function startOtel(serviceName: string, collectorUrl?: string) {
  if (sdk) return; // idempotent
  const base = (collectorUrl || process.env.OTEL_COLLECTOR_URL || 'http://localhost:4318').replace(/\/$/, '');
    const exporter = new OTLPTraceExporter({
    url: `${base}/v1/traces`,
    });
  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: exporter,
    instrumentations: [new HttpInstrumentation(), new FastifyInstrumentation()],
  });
  await sdk.start();
  process.on('SIGTERM', async () => { await sdk?.shutdown(); process.exit(0); });
}
