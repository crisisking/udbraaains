#!/bin/bash

python manage.py syncdb --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec $@
