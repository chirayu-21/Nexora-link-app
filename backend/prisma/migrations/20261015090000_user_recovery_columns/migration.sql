ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerificationToken_key"
ON "User"("emailVerificationToken");

CREATE UNIQUE INDEX IF NOT EXISTS "User_passwordResetToken_key"
ON "User"("passwordResetToken");
