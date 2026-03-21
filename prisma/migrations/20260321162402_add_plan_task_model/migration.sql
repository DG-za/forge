-- CreateTable
CREATE TABLE "PlanTask" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "issueNumber" INTEGER,
    "title" TEXT NOT NULL,
    "acceptanceCriteria" TEXT[],
    "dependencies" INTEGER[],
    "complexity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanTask_runId_orderIndex_key" ON "PlanTask"("runId", "orderIndex");

-- AddForeignKey
ALTER TABLE "PlanTask" ADD CONSTRAINT "PlanTask_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
