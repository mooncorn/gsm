#!/bin/bash
set -e

# Start API
/app/api &

# Serve frontend using built-in web server
serve -s /app/frontend -l 8282 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 