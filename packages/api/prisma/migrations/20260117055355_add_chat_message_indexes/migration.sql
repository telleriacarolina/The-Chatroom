-- CreateIndex
CREATE INDEX "ChatMessage_loungeId_createdAt_idx" ON "ChatMessage"("loungeId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_isDeleted_idx" ON "ChatMessage"("isDeleted");
