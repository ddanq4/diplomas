-- CreateTable
CREATE TABLE "Diploma" (
    "id" SERIAL NOT NULL,
    "studentName" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "diplomaNumber" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diploma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diploma_diplomaNumber_key" ON "Diploma"("diplomaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
