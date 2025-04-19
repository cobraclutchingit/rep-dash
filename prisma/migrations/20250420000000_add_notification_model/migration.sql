-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'CONTEST', 'LINK', 'OTHER');

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "resourceId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN "category" TEXT;

-- AlterTable 
ALTER TABLE "ImportantLink" ADD COLUMN "categorySlug" TEXT;

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contest" ADD COLUMN "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");
CREATE INDEX "Announcement_category_idx" ON "Announcement"("category");
CREATE INDEX "ImportantLink_categorySlug_idx" ON "ImportantLink"("categorySlug");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;