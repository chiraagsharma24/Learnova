#!/usr/bin/env bash

set -e

case "$1" in
    start)
        docker compose \
            --env-file=backend/.env \
            up -d
    ;;

    stop)
        docker compose \
            --env-file=backend/.env \
            down
    ;;

    *)
        echo "Usage: $0 {start|stop}"
        exit 1
    ;;
esac
