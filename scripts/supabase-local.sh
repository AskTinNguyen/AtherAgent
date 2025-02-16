#!/bin/bash

function start_supabase() {
    echo "Starting local Supabase..."
    docker-compose up -d supabase-db supabase-studio kong meta auth realtime
    echo "Waiting for services to be ready..."
    sleep 10
    apply_migrations
}

function stop_supabase() {
    echo "Stopping local Supabase..."
    docker-compose stop supabase-db supabase-studio kong meta auth realtime
}

function apply_migrations() {
    echo "Applying database migrations..."
    docker-compose exec -T supabase-db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_initial_schema.sql
}

function reset_database() {
    echo "Resetting database..."
    docker-compose down -v
    docker-compose up -d supabase-db
    echo "Waiting for database to be ready..."
    sleep 10
    apply_migrations
}

case "$1" in
    "start")
        start_supabase
        ;;
    "stop")
        stop_supabase
        ;;
    "reset")
        reset_database
        ;;
    "migrate")
        apply_migrations
        ;;
    *)
        echo "Usage: $0 {start|stop|reset|migrate}"
        exit 1
        ;;
esac 