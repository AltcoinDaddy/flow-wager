
SELECT
    table_schema,
    table_name,
    'Available Flow table' as description
FROM information_schema.tables
WHERE LOWER(table_schema) LIKE '%flow%'
   OR LOWER(table_name) LIKE '%flow%'
ORDER BY table_schema, table_name

UNION ALL

-- Step 2: Check for common blockchain table patterns
SELECT
    table_schema,
    table_name,
    'Potential blockchain table' as description
FROM information_schema.tables
WHERE LOWER(table_name) IN ('events', 'transactions', 'blocks', 'logs')
   AND table_schema NOT IN ('information_schema', 'sys', 'mysql', 'performance_schema')
ORDER BY table_schema, table_name;
