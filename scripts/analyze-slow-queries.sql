-- ==============================================================================
-- GESTMONEY — Analyse des performances PostgreSQL
-- À exécuter sur le VPS : psql -U gestmoney_user -d gestmoney -f analyze-slow-queries.sql
-- Nécessite l'extension pg_stat_statements (activée par défaut sur PostgreSQL 14+)
-- ==============================================================================

-- 1. Activer l'extension si ce n'est pas déjà fait (une seule fois, en superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==============================================================================
-- REQUÊTES LES PLUS LENTES (par temps moyen d'exécution)
-- ==============================================================================
SELECT
  LEFT(query, 120)          AS requete,
  calls                     AS nb_appels,
  ROUND(total_exec_time::numeric, 2)  AS temps_total_ms,
  ROUND(mean_exec_time::numeric, 2)   AS temps_moyen_ms,
  ROUND(stddev_exec_time::numeric, 2) AS ecart_type_ms,
  rows                      AS lignes_retournees
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ==============================================================================
-- REQUÊTES CONSOMMANT LE PLUS DE TEMPS TOTAL (charge cumulée)
-- ==============================================================================
SELECT
  LEFT(query, 120)         AS requete,
  calls                    AS nb_appels,
  ROUND(total_exec_time::numeric, 2) AS temps_total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- ==============================================================================
-- INDEX JAMAIS UTILISÉS (candidats à la suppression)
-- ==============================================================================
SELECT
  schemaname  AS schema,
  tablename   AS table,
  indexname   AS index,
  idx_scan    AS nb_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ==============================================================================
-- TABLES AVEC LE PLUS DE SEQUENTIAL SCANS (manque d'index ?)
-- ==============================================================================
SELECT
  schemaname  AS schema,
  relname     AS table,
  seq_scan    AS scans_sequentiels,
  seq_tup_read AS lignes_lues_seq,
  idx_scan    AS scans_index,
  n_live_tup  AS lignes_vivantes
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_scan DESC
LIMIT 20;

-- ==============================================================================
-- TAILLE DES TABLES ET INDEX (les plus volumineuses)
-- ==============================================================================
SELECT
  relname                         AS objet,
  relkind                         AS type,
  pg_size_pretty(pg_relation_size(oid)) AS taille
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind IN ('r', 'i')
ORDER BY pg_relation_size(oid) DESC
LIMIT 30;

-- ==============================================================================
-- CONNEXIONS ACTIVES
-- ==============================================================================
SELECT
  state,
  COUNT(*) AS nb_connexions,
  MAX(EXTRACT(EPOCH FROM (now() - query_start)))::int AS max_duree_s
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
