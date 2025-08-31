/*
  Warnings:

  - You are about to drop the `BlockedTimeSlot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `designerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "designerId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."BlockedTimeSlot";

-- CreateTable
CREATE TABLE "public"."Designer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Designer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Schedule" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "designerId" TEXT NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Schedule" ADD CONSTRAINT "Schedule_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "public"."Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "public"."Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
