-- AlterTable
ALTER TABLE "PlanTask" ADD COLUMN     "planVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "planSummary" TEXT,
ADD COLUMN     "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
