-- AlterTable (idempotent: skip if column exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'is_active') THEN
    ALTER TABLE "tenants" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenants_is_active_idx" ON "tenants"("is_active");

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "staff_user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "purpose" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2),
    "reward_id" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_events_tenant_id_idempotency_key_key" ON "scan_events"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "scan_events_tenant_id_created_at_idx" ON "scan_events"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "scan_events_customer_id_purpose_created_at_idx" ON "scan_events"("customer_id", "purpose", "created_at");

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
