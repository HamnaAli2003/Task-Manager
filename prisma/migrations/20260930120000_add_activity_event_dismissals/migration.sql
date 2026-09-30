CREATE TABLE "ActivityEventDismissal" (
    "activityEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEventDismissal_pkey" PRIMARY KEY ("activityEventId", "userId")
);

CREATE INDEX "ActivityEventDismissal_userId_idx" ON "ActivityEventDismissal"("userId");

ALTER TABLE "ActivityEventDismissal" ADD CONSTRAINT "ActivityEventDismissal_activityEventId_fkey"
    FOREIGN KEY ("activityEventId") REFERENCES "ActivityEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityEventDismissal" ADD CONSTRAINT "ActivityEventDismissal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;