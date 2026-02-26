# Database Schema — Code Analysis

**Source**: Flyway V1__initial_schema.sql + JPA entity Sorter.java
**Confidence**: 🔸 CODE_ONLY

## Database: wcs_db (MySQL 8.0)

### Table: sorters

```sql
CREATE TABLE sorters (
  id          VARCHAR(12)  NOT NULL PRIMARY KEY,
  sorter_id   VARCHAR(64)  NOT NULL,
  sorter_name VARCHAR(128) NOT NULL,
  constraints JSON         NULL,
  nodes       JSON         NULL,
  edges       JSON         NULL,
  created_at  DATETIME(6)  NOT NULL,
  updated_at  DATETIME(6)  NOT NULL,
  UNIQUE KEY uq_sorters_sorter_id (sorter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Column Details

| Column | Type | Constraints | JPA Annotation | Notes |
|--------|------|-------------|---------------|-------|
| id | VARCHAR(12) | PRIMARY KEY, NOT NULL | @Id | 12-char UUID fragment (no dashes), application-generated |
| sorter_id | VARCHAR(64) | NOT NULL, UNIQUE | @Column(unique=true, nullable=false) | Business identifier, external-facing |
| sorter_name | VARCHAR(128) | NOT NULL | @Column(nullable=false) | Display name |
| constraints | JSON | NULL | @Column(columnDefinition="JSON") | Global topology constraints as JSON string |
| nodes | JSON | NULL | @Column(columnDefinition="JSON") | Array of node objects as JSON string |
| edges | JSON | NULL | @Column(columnDefinition="JSON") | Array of edge objects as JSON string |
| created_at | DATETIME(6) | NOT NULL | @Column(nullable=false, updatable=false) | Set by @PrePersist |
| updated_at | DATETIME(6) | NOT NULL | @Column(nullable=false) | Set by @PrePersist and @PreUpdate |

### Indexes

| Index | Columns | Type |
|-------|---------|------|
| PRIMARY | id | UNIQUE |
| uq_sorters_sorter_id | sorter_id | UNIQUE |

### JSON Column Schemas

**constraints** (global_constraints):
```json
{
  "max_tu_weight_kg": 25,
  "max_tu_dimensions_cm": {
    "length": 100,
    "width": 80,
    "height": 60
  }
}
```
- Validated: max_tu_weight_kg must be in (0, 200]
- Validated: all dimensions must be > 0

**nodes**:
```json
[
  {
    "id": "POS-001",
    "name": "Entry Point",
    "type": "entry",
    "capacity": 10
  }
]
```
- Limit: max 500 items (@Size validation)
- Validated: no duplicate IDs

**edges**:
```json
[
  {
    "id": "E-001",
    "from": "POS-001",
    "to": "POS-002",
    "distance_m": 10.0,
    "max_throughput_tu_per_min": 60
  }
]
```
- Limit: max 2000 items (@Size validation)
- Validated: distance_m >= 0, max_throughput_tu_per_min > 0

## Flyway Migration History

| Version | File | Description |
|---------|------|-------------|
| V1 | V1__initial_schema.sql | Initial schema: creates sorters table |

## Flyway Configuration

| Setting | Dev | Prod |
|---------|-----|------|
| enabled | true | true |
| locations | classpath:db/migration | classpath:db/migration |
| baseline-on-migrate | true | false |
| ddl-auto | validate | validate |
