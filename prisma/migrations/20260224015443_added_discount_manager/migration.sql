-- CreateTable
CREATE TABLE "discount_manager" (
    "id" SERIAL NOT NULL,
    "percentageAmount" INTEGER NOT NULL DEFAULT 5,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "discount_manager_pkey" PRIMARY KEY ("id")
);
