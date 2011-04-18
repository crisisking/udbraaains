#/bin/bash

export DJANGO_SETTINGS_MODULE=brains.settings
export PYTHONPATH=$PYTHONPATH:$(pwd):$(pwd)/brains

cd skybot; python bot.py;