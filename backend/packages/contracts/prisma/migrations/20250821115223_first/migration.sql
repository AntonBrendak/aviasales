-- CreateEnum
CREATE TYPE "public"."PaxType" AS ENUM ('ADT', 'CHD', 'INF');

-- CreateEnum
CREATE TYPE "public"."CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateTable
CREATE TABLE "public"."SearchSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "origin" VARCHAR(3) NOT NULL,
    "destination" VARCHAR(3) NOT NULL,
    "departure" TIMESTAMP(3) NOT NULL,
    "return" TIMESTAMP(3),
    "pax" JSONB NOT NULL,
    "cabin" "public"."CabinClass" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "searchSessionId" UUID NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "dedupHash" VARCHAR(64) NOT NULL,
    "itinerary" JSONB NOT NULL,
    "baggage" JSONB,
    "fareRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricedOffer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offerId" UUID NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "brand" VARCHAR(64),
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricedOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pricedOfferId" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Traveler" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "type" "public"."PaxType" NOT NULL,
    "firstName" VARCHAR(80) NOT NULL,
    "lastName" VARCHAR(80) NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "docType" VARCHAR(16),
    "docNumber" VARCHAR(32),

    CONSTRAINT "Traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "method" VARCHAR(32),
    "txnId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Refund" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PNR" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "locator" VARCHAR(12) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PNR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ticket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pnrId" UUID NOT NULL,
    "ticketNumber" VARCHAR(20) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "issuedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AncillaryOffer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offerId" UUID NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "details" JSONB,

    CONSTRAINT "AncillaryOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AncillaryOrder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "details" JSONB,

    CONSTRAINT "AncillaryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchSession_origin_destination_departure_cabin_idx" ON "public"."SearchSession"("origin", "destination", "departure", "cabin");

-- CreateIndex
CREATE INDEX "SearchSession_createdAt_idx" ON "public"."SearchSession"("createdAt");

-- CreateIndex
CREATE INDEX "Offer_provider_searchSessionId_idx" ON "public"."Offer"("provider", "searchSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_searchSessionId_dedupHash_key" ON "public"."Offer"("searchSessionId", "dedupHash");

-- CreateIndex
CREATE INDEX "PricedOffer_createdAt_idx" ON "public"."PricedOffer"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Traveler_orderId_type_idx" ON "public"."Traveler"("orderId", "type");

-- CreateIndex
CREATE INDEX "Payment_orderId_status_idx" ON "public"."Payment"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_txnId_key" ON "public"."Payment"("txnId");

-- CreateIndex
CREATE UNIQUE INDEX "PNR_orderId_key" ON "public"."PNR"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PNR_locator_key" ON "public"."PNR"("locator");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON "public"."Ticket"("ticketNumber");

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_searchSessionId_fkey" FOREIGN KEY ("searchSessionId") REFERENCES "public"."SearchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricedOffer" ADD CONSTRAINT "PricedOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_pricedOfferId_fkey" FOREIGN KEY ("pricedOfferId") REFERENCES "public"."PricedOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Traveler" ADD CONSTRAINT "Traveler_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PNR" ADD CONSTRAINT "PNR_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ticket" ADD CONSTRAINT "Ticket_pnrId_fkey" FOREIGN KEY ("pnrId") REFERENCES "public"."PNR"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AncillaryOffer" ADD CONSTRAINT "AncillaryOffer_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "public"."Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AncillaryOrder" ADD CONSTRAINT "AncillaryOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
