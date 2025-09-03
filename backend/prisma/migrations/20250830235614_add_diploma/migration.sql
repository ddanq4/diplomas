-- CreateTable
CREATE TABLE "Diploma" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "faculty" TEXT,
    "specialty" TEXT,
    "year" INTEGER NOT NULL,
    "diplomaNumber" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diploma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diploma_diplomaNumber_key" ON "Diploma"("diplomaNumber");
