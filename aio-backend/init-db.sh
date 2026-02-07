#!/bin/bash
set -e

# Perform all actions as the postgres user
export PGUSER="$POSTGRES_USER"

# Create the database if it doesn't exist
psql -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || psql -c "CREATE DATABASE \"$POSTGRES_DB\""

# Apply the base schema
psql -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/AIO_backEnd/supabase_schema.sql

# Apply all migrations in order
for f in /docker-entrypoint-initdb.d/AIO_backEnd/migrations/*.sql; do
  echo "Applying migration $f"
  psql -d "$POSTGRES_DB" -f "$f"
done
