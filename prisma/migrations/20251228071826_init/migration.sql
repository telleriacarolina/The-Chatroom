-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('REGISTERED', 'GUEST');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('AGE_ONLY', 'ID_FULL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('EIGHTEEN_PLUS', 'EIGHTEEN_PLUS_RED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'LINK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'PENDING', 'REMOVED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('PHOTOS', 'VIDEOS', 'CUSTOM_CONTENT', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SFW', 'NSFW');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('MAIN_LOUNGE', 'RED_LOUNGE');

-- CreateEnum
CREATE TYPE "TransactionPaymentMethod" AS ENUM ('STRIPE', 'PAYPAL', 'CRYPTO');

-- CreateEnum
CREATE TYPE "TransactionPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'MUTE', 'KICK', 'BAN_TEMP', 'BAN_PERMANENT', 'MESSAGE_DELETE', 'ITEM_REMOVE');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'UNDERAGE', 'SCAM', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "permanentUsername" TEXT,
    "preferredName" TEXT,
    "avatarUrl" TEXT,
    "accountType" "AccountType" NOT NULL,
    "ageVerified" BOOLEAN NOT NULL DEFAULT false,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "idVerificationDate" TIMESTAMP(3),
    "idVerificationProvider" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "banExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "stayOnline" BOOLEAN NOT NULL DEFAULT false,
    "stayOnlineUntil" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "stayOnlineEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TempSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "temporaryUsername" TEXT NOT NULL,
    "ageCategory" "AgeCategory" NOT NULL,
    "sessionToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IDVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationType" "VerificationType" NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentImageUrl" TEXT NOT NULL,
    "selfieImageUrl" TEXT NOT NULL,
    "verificationProvider" TEXT,
    "verificationProviderResponse" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IDVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lounge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL,
    "iconColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxCapacity" INTEGER,
    "currentUserCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lounge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageRoom" (
    "id" TEXT NOT NULL,
    "loungeId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "flagEmoji" TEXT NOT NULL,
    "currentUserCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LanguageRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "loungeId" TEXT NOT NULL,
    "languageRoomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayUsername" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL,
    "attachmentUrl" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "previewUrls" JSONB,
    "accessLevel" "AccessLevel" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "paymentMethod" "TransactionPaymentMethod" NOT NULL,
    "paymentStatus" "TransactionPaymentStatus" NOT NULL,
    "transactionFee" DECIMAL(12,2),
    "sellerPayout" DECIMAL(12,2),
    "paymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetMessageId" TEXT,
    "targetItemId" TEXT,
    "actionType" "ModerationActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "reportedMessageId" TEXT,
    "reportedItemId" TEXT,
    "reportReason" "ReportReason" NOT NULL,
    "reportDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventDetails" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_permanentUsername_key" ON "User"("permanentUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "TempSession_temporaryUsername_key" ON "TempSession"("temporaryUsername");

-- CreateIndex
CREATE UNIQUE INDEX "TempSession_sessionToken_key" ON "TempSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Lounge_slug_key" ON "Lounge"("slug");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TempSession" ADD CONSTRAINT "TempSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IDVerification" ADD CONSTRAINT "IDVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageRoom" ADD CONSTRAINT "LanguageRoom_loungeId_fkey" FOREIGN KEY ("loungeId") REFERENCES "Lounge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_loungeId_fkey" FOREIGN KEY ("loungeId") REFERENCES "Lounge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_languageRoomId_fkey" FOREIGN KEY ("languageRoomId") REFERENCES "LanguageRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetMessageId_fkey" FOREIGN KEY ("targetMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "MarketplaceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedMessageId_fkey" FOREIGN KEY ("reportedMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedItemId_fkey" FOREIGN KEY ("reportedItemId") REFERENCES "MarketplaceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
