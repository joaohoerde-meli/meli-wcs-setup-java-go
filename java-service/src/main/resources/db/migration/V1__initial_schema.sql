-- WCS Java Service — initial schema
-- Managed by Flyway; do NOT modify this file after it has been applied.
-- To change the schema, create a new migration: V2__<description>.sql

CREATE TABLE IF NOT EXISTS sorters (
    id          VARCHAR(12)  NOT NULL,
    sorter_id   VARCHAR(64)  NOT NULL,
    sorter_name VARCHAR(128) NOT NULL,
    constraints JSON         NULL,
    nodes       JSON         NULL,
    edges       JSON         NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_sorters_sorter_id (sorter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
