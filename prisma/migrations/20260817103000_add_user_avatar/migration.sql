-- Store a compact user-selected profile image alongside the account record.
ALTER TABLE "User" ADD COLUMN "avatarDataUrl" TEXT;
