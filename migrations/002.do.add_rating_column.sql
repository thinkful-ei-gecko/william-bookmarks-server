CREATE TYPE rating_number AS ENUM (
  '1',
  '2',
  '3',
  '4',
  '5'
);

ALTER TABLE bookmark_table
  ADD COLUMN
    rating rating_number NOT NULL;