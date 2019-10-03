ALTER TABLE bookmark_table
  DROP COLUMN IF EXISTS rating;

DROP TYPE IF EXISTS rating_number;