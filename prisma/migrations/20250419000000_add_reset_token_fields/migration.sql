-- Add reset token fields to User model
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);

-- Create index for reset token
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");