
## Быстрый старт

```bash
# 0) PNPM
corepack enable && corepack use pnpm@9

# 1) Клонирование и env
git clone <repo> air-platform && cd air-platform
cp .env.example .env

# 2) Инфраструктура (Postgres/Redis/Kafka/OpenSearch/MinIO/Temporal/Jaeger/OTel)
docker compose -f infra/docker-compose.dev.yml -f infra/docker-compose.override.yml up -d

# 3) Установка зависимостей
pnpm i

# 4) Миграции и генерация клиента
pnpm db:setup   # = migrate + generate

# 5) Генерация OpenAPI SDK
pnpm openapi:gen

# 6) Запуск сервисов
pnpm dev:all
Проверки
Health BFF: http://localhost:8080/healthz → { ok: true }

Temporal UI: http://localhost:8088

Jaeger (трейсы): http://localhost:16686

OpenSearch Dashboards: http://localhost:5601

MinIO Console: http://localhost:9001 (minio / minio123)

Тесты и качество
pnpm lint — проверка стиля и ошибок ESLint.

pnpm typecheck — строгая проверка типов TS.

pnpm test — юнит- и property-тесты (fast-check, vitest).

pnpm coverage — покрытие кода.

pnpm ci:check — единый quality-gate (lint+types+tests+openapi).

Acceptance (Phase 1)
✅ Docker-infra поднимает Postgres/Redis/Kafka/OpenSearch/MinIO/Temporal/OTel/Jaeger без ошибок.
✅ pnpm i и pnpm dev:all выполняются успешно.
✅ GET /healthz возвращает 200 { ok: true }.
✅ В Jaeger видны спаны от BFF (телеметрия).
✅ pnpm lint и pnpm typecheck без ошибок.
✅ Prisma миграции проходят (pnpm db:migrate), клиент генерируется (pnpm db:generate).
✅ OpenAPI SDK генерируется (pnpm openapi:gen).
✅ Коммиты проходят через commitlint и husky-хуки.

Доменная модель

SearchSession → Offer → PricedOffer → Order → PNR → Ticket

Связанные сущности: Traveler, Payment, Refund, Ancillary (bags/SSR).

Файлы:

Prisma schema: packages/contracts/prisma/schema.prisma

OpenAPI v1 (BFF): packages/contracts/openapi/bff.v1.yaml

Типы: packages/contracts/types/domain.ts

Структура проекта
bash
Копіювати
Редагувати
apps/                  # bff, workflows
services/              # доменные сервисы (search, pricing, booking …)
packages/
  contracts/           # prisma schema, openapi, types
  lib/                 # shared utils
  otel/                # OpenTelemetry provider
infra/
  docker-compose.dev.yml
  docker-compose.override.yml
  otel-collector.yaml
  temporal/dynamicconfig/development.yaml
docs/
  erd.md
  erd.png
Полезные команды
bash
Копіювати
Редагувати
# Health Temporal
docker compose -f infra/docker-compose.dev.yml exec temporal \
  tctl --address temporal:7233 cluster health

# Prisma
pnpm db:migrate
pnpm db:generate
pnpm db:studio

# OpenAPI SDK
pnpm openapi:gen
