-- Expand primary key column from VARCHAR(12) to VARCHAR(36) to accommodate full UUIDs.
-- Previous implementation truncated UUIDs to 12 chars, which risks collisions at scale.
ALTER TABLE sorters MODIFY id VARCHAR(36) NOT NULL;
