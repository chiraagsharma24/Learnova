#!/usr/bin/env bash

set -e

case "$1" in
    # Auth
    signup)
    curl -X POST http://localhost:1337/auth/signup \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$2\",\"email\":\"$2@email.com\",\"password\":\"${2}123\"}"
    ;;

    login)
    curl -X POST http://localhost:1337/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$2@email.com\",\"password\":\"${2}123\"}"
    ;;

    me)
    curl -X GET http://localhost:1337/auth/me \
      -H "Authorization: Bearer $2"
    ;;


    # Class
    class)
    curl -X POST http://localhost:1337/class \
        -H "Authorization: Bearer $2" \
        -H "Content-Type: application/json" \
        -d "{\"className\": \"$3\"}"
    ;;

    'class/id')
    curl -X GET http://localhost:1337/class/$3 \
        -H "Authorization: Bearer $2"
    ;;

    'class/id/add-student')
    curl -X POST http://localhost:1337/class/$3/add-student \
        -H "Authorization: Bearer $2" \
        -H "Content-Type: application/json" \
        -d "{\"studentId\": \"$4\"}"
    ;;

    'class/id/my-attendance')
    curl -X GET http://localhost:1337/class/$3/my-attendance \
        -H "Authorization: Bearer $2"
    ;;


    # Students
    'students')
    curl -X GET http://localhost:1337/students \
        -H "Authorization: Bearer $2"
    ;;


    # Attendance
    'attendance/start')
    curl -X POST http://localhost:1337/attendance/start \
        -H "Authorization: Bearer $2" \
        -H "Content-Type: application/json" \
        -d "{\"classId\": \"$3\"}"
    ;;


    *)
    echo "Usage: $0 {signup|login|me}"
    exit 1
    ;;
esac
