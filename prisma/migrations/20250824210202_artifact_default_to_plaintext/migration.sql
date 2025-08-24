-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Artifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'plaintext',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stageId" TEXT NOT NULL,
    CONSTRAINT "Artifact_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Artifact" ("content", "createdAt", "id", "language", "name", "stageId", "type", "updatedAt") SELECT "content", "createdAt", "id", "language", "name", "stageId", "type", "updatedAt" FROM "Artifact";
DROP TABLE "Artifact";
ALTER TABLE "new_Artifact" RENAME TO "Artifact";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
