-- CreateEnum
CREATE TYPE "GoogleSyncStatus" AS ENUM ('NONE', 'PENDING', 'SYNCED', 'ERROR');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleSyncError" TEXT,
ADD COLUMN     "googleSyncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "googleSyncedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GoogleCalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT,
    "accessToken" TEXT,
    "refreshTokenEnc" TEXT,
    "expiryDate" TIMESTAMP(3),
    "calendarId" TEXT,
    "channelId" TEXT,
    "resourceId" TEXT,
    "channelExpiration" TIMESTAMP(3),
    "syncToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarConnection_userId_key" ON "GoogleCalendarConnection"("userId");

-- CreateIndex
CREATE INDEX "GoogleCalendarConnection_channelId_idx" ON "GoogleCalendarConnection"("channelId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarConnection" ADD CONSTRAINT "GoogleCalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
