#!/bin/bash

echo "upstream brains { 
    server $DJANGO_PORT_8000_TCP_ADDR:$DJANGO_PORT_8000_TCP_PORT;
}
" > /etc/nginx/django.conf

exec $@
