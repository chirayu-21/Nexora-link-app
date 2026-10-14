ALTER TABLE "Conversation"
ADD COLUMN "communityId" TEXT;

CREATE UNIQUE INDEX "Conversation_communityId_key"
ON "Conversation"("communityId");

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Conversation" ("id", "name", "isGroup", "createdById", "communityId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  community."name" || ' Club',
  true,
  owner."userId",
  community."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Community" AS community
LEFT JOIN LATERAL (
  SELECT member."userId"
  FROM "CommunityMember" AS member
  WHERE member."communityId" = community."id"
  ORDER BY (member."role" = 'ADMIN') DESC, member."joinedAt" ASC
  LIMIT 1
) AS owner ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "Conversation" AS existing
  WHERE existing."communityId" = community."id"
);

INSERT INTO "ConversationParticipant" ("id", "conversationId", "userId", "role", "joinedAt", "muted")
SELECT gen_random_uuid()::TEXT, chat."id", member."userId", member."role", member."joinedAt", false
FROM "CommunityMember" AS member
JOIN "Conversation" AS chat ON chat."communityId" = member."communityId"
ON CONFLICT ("conversationId", "userId") DO NOTHING;

ALTER TABLE "EventInterest"
ADD COLUMN "reminderSentAt" TIMESTAMP(3),
ADD COLUMN "reminderClaimedAt" TIMESTAMP(3);
