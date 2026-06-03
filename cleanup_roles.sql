DELETE FROM role
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id FROM role ORDER BY name, id
);

SELECT 'Duplicates deleted successfully' as message;

SELECT name, COUNT(*) as count FROM role GROUP BY name;

