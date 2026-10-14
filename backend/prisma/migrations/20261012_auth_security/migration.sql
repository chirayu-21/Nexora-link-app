-- Existing accounts remain valid; new registrations require both fields at API validation.
ALTER TABLE "User" ADD COLUMN "mobileNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "age" INTEGER;
ALTER TABLE "User" ADD COLUMN "otpCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");
