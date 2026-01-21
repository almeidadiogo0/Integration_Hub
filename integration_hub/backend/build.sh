#!/usr/bin/env bash
# Reference: https://docs.render.com/deploy-django

# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate
