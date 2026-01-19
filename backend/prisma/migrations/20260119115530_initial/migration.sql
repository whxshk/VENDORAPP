-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ISSUE', 'REDEEM');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "hashed_password" VARCHAR(255) NOT NULL,
    "roles" JSONB NOT NULL DEFAULT '[]',
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "qr_token_secret" VARCHAR(255) NOT NULL,
    "rotation_interval_sec" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_merchant_accounts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "membership_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_merchant_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(255) NOT NULL,
    "device_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_ledger_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "operation_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "points_required" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "points_deducted" DECIMAL(15,2) NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rulesets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_type" VARCHAR(100) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rulesets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "device_identifier" VARCHAR(255) NOT NULL,
    "registered_by_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "published_at" TIMESTAMPTZ(6),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_balances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_summaries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "transaction_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_daily_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "metric_date" DATE NOT NULL,
    "active_customers" INTEGER NOT NULL DEFAULT 0,
    "repeat_customers" INTEGER NOT NULL DEFAULT 0,
    "transactions_issue" INTEGER NOT NULL DEFAULT 0,
    "transactions_redeem" INTEGER NOT NULL DEFAULT 0,
    "transactions_adjust" INTEGER NOT NULL DEFAULT 0,
    "transactions_reverse" INTEGER NOT NULL DEFAULT 0,
    "transactions_total" INTEGER NOT NULL DEFAULT 0,
    "redemption_rate" DECIMAL(5,4),
    "avg_time_to_redeem_hours" DECIMAL(10,2),
    "scan_errors_expired_qr" INTEGER NOT NULL DEFAULT 0,
    "scan_errors_insufficient_balance" INTEGER NOT NULL DEFAULT 0,
    "scan_errors_unauthorized_device" INTEGER NOT NULL DEFAULT 0,
    "scan_errors_total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_onboarding_funnel" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "merchant_signup_at" TIMESTAMPTZ(6),
    "first_location_created_at" TIMESTAMPTZ(6),
    "first_staff_invited_at" TIMESTAMPTZ(6),
    "first_device_registered_at" TIMESTAMPTZ(6),
    "first_scan_at" TIMESTAMPTZ(6),
    "time_to_location_minutes" INTEGER,
    "time_to_staff_minutes" INTEGER,
    "time_to_device_minutes" INTEGER,
    "time_to_first_scan_minutes" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_onboarding_funnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_customer_activity" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_transaction_at" TIMESTAMPTZ(6),
    "last_transaction_at" TIMESTAMPTZ(6),
    "transaction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_customer_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_reward_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reward_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "redemption_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pilot_reward_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenants_created_at_idx" ON "tenants"("created_at");

-- CreateIndex
CREATE INDEX "locations_tenant_id_idx" ON "locations"("tenant_id");

-- CreateIndex
CREATE INDEX "locations_is_active_idx" ON "locations"("is_active");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- CreateIndex
CREATE INDEX "customer_merchant_accounts_customer_id_idx" ON "customer_merchant_accounts"("customer_id");

-- CreateIndex
CREATE INDEX "customer_merchant_accounts_tenant_id_idx" ON "customer_merchant_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_merchant_accounts_membership_status_idx" ON "customer_merchant_accounts"("membership_status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_merchant_accounts_customer_id_tenant_id_key" ON "customer_merchant_accounts"("customer_id", "tenant_id");

-- CreateIndex
CREATE INDEX "transactions_tenant_id_idx" ON "transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "transactions_customer_id_idx" ON "transactions"("customer_id");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "transactions_idempotency_key_idx" ON "transactions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tenant_id_idempotency_key_key" ON "transactions"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_tenant_id_idx" ON "loyalty_ledger_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_transaction_id_idx" ON "loyalty_ledger_entries"("transaction_id");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_customer_id_idx" ON "loyalty_ledger_entries"("customer_id");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_created_at_idx" ON "loyalty_ledger_entries"("created_at");

-- CreateIndex
CREATE INDEX "loyalty_ledger_entries_tenant_id_customer_id_created_at_idx" ON "loyalty_ledger_entries"("tenant_id", "customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_ledger_entries_tenant_id_idempotency_key_operation__key" ON "loyalty_ledger_entries"("tenant_id", "idempotency_key", "operation_type");

-- CreateIndex
CREATE INDEX "rewards_tenant_id_idx" ON "rewards"("tenant_id");

-- CreateIndex
CREATE INDEX "rewards_is_active_idx" ON "rewards"("is_active");

-- CreateIndex
CREATE INDEX "redemptions_tenant_id_idx" ON "redemptions"("tenant_id");

-- CreateIndex
CREATE INDEX "redemptions_customer_id_idx" ON "redemptions"("customer_id");

-- CreateIndex
CREATE INDEX "redemptions_reward_id_idx" ON "redemptions"("reward_id");

-- CreateIndex
CREATE INDEX "redemptions_status_idx" ON "redemptions"("status");

-- CreateIndex
CREATE INDEX "redemptions_idempotency_key_idx" ON "redemptions"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "redemptions_tenant_id_idempotency_key_key" ON "redemptions"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "rulesets_tenant_id_idx" ON "rulesets"("tenant_id");

-- CreateIndex
CREATE INDEX "rulesets_rule_type_idx" ON "rulesets"("rule_type");

-- CreateIndex
CREATE INDEX "rulesets_effective_from_effective_to_idx" ON "rulesets"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "devices_tenant_id_idx" ON "devices"("tenant_id");

-- CreateIndex
CREATE INDEX "devices_location_id_idx" ON "devices"("location_id");

-- CreateIndex
CREATE INDEX "devices_is_active_idx" ON "devices"("is_active");

-- CreateIndex
CREATE INDEX "devices_device_identifier_idx" ON "devices"("device_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "devices_tenant_id_device_identifier_key" ON "devices"("tenant_id", "device_identifier");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "outbox_events_tenant_id_idx" ON "outbox_events"("tenant_id");

-- CreateIndex
CREATE INDEX "outbox_events_status_idx" ON "outbox_events"("status");

-- CreateIndex
CREATE INDEX "outbox_events_created_at_idx" ON "outbox_events"("created_at");

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");

-- CreateIndex
CREATE INDEX "customer_balances_tenant_id_idx" ON "customer_balances"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_balances_customer_id_idx" ON "customer_balances"("customer_id");

-- CreateIndex
CREATE INDEX "customer_balances_last_updated_at_idx" ON "customer_balances"("last_updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_balances_tenant_id_customer_id_key" ON "customer_balances"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_summaries_transaction_id_key" ON "transaction_summaries"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_summaries_tenant_id_idx" ON "transaction_summaries"("tenant_id");

-- CreateIndex
CREATE INDEX "transaction_summaries_customer_id_idx" ON "transaction_summaries"("customer_id");

-- CreateIndex
CREATE INDEX "transaction_summaries_transaction_date_idx" ON "transaction_summaries"("transaction_date");

-- CreateIndex
CREATE INDEX "transaction_summaries_type_idx" ON "transaction_summaries"("type");

-- CreateIndex
CREATE INDEX "pilot_daily_metrics_tenant_id_metric_date_idx" ON "pilot_daily_metrics"("tenant_id", "metric_date");

-- CreateIndex
CREATE INDEX "pilot_daily_metrics_location_id_metric_date_idx" ON "pilot_daily_metrics"("location_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_daily_metrics_tenant_id_location_id_metric_date_key" ON "pilot_daily_metrics"("tenant_id", "location_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_onboarding_funnel_tenant_id_key" ON "pilot_onboarding_funnel"("tenant_id");

-- CreateIndex
CREATE INDEX "pilot_onboarding_funnel_tenant_id_idx" ON "pilot_onboarding_funnel"("tenant_id");

-- CreateIndex
CREATE INDEX "pilot_customer_activity_tenant_id_idx" ON "pilot_customer_activity"("tenant_id");

-- CreateIndex
CREATE INDEX "pilot_customer_activity_customer_id_idx" ON "pilot_customer_activity"("customer_id");

-- CreateIndex
CREATE INDEX "pilot_customer_activity_tenant_id_last_transaction_at_idx" ON "pilot_customer_activity"("tenant_id", "last_transaction_at");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_customer_activity_tenant_id_customer_id_key" ON "pilot_customer_activity"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "pilot_reward_usage_tenant_id_metric_date_idx" ON "pilot_reward_usage"("tenant_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "pilot_reward_usage_tenant_id_reward_id_metric_date_key" ON "pilot_reward_usage"("tenant_id", "reward_id", "metric_date");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_merchant_accounts" ADD CONSTRAINT "customer_merchant_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_merchant_accounts" ADD CONSTRAINT "customer_merchant_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger_entries" ADD CONSTRAINT "loyalty_ledger_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger_entries" ADD CONSTRAINT "loyalty_ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger_entries" ADD CONSTRAINT "loyalty_ledger_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rulesets" ADD CONSTRAINT "rulesets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_registered_by_user_id_fkey" FOREIGN KEY ("registered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_balances" ADD CONSTRAINT "customer_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_balances" ADD CONSTRAINT "customer_balances_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_summaries" ADD CONSTRAINT "transaction_summaries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_summaries" ADD CONSTRAINT "transaction_summaries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_summaries" ADD CONSTRAINT "transaction_summaries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_daily_metrics" ADD CONSTRAINT "pilot_daily_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_daily_metrics" ADD CONSTRAINT "pilot_daily_metrics_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_onboarding_funnel" ADD CONSTRAINT "pilot_onboarding_funnel_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_customer_activity" ADD CONSTRAINT "pilot_customer_activity_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_customer_activity" ADD CONSTRAINT "pilot_customer_activity_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_reward_usage" ADD CONSTRAINT "pilot_reward_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pilot_reward_usage" ADD CONSTRAINT "pilot_reward_usage_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
