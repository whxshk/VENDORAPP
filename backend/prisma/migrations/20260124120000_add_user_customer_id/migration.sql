-- AlterTable
ALTER TABLE "users" ADD COLUMN "customer_id" TEXT;

-- CreateIndex
CREATE INDEX "users_customer_id_idx" ON "users"("customer_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
