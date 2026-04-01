ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

UPDATE "User"
SET "role" = 'SUPER_ADMIN'
WHERE "id" = (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'ADMIN'
  ORDER BY "id"
  LIMIT 1
);
