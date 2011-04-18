#/bin/bash

export DJANGO_SETTINGS_MODULE=brains.settings
export PYTHONPATH=$PYTHONPATH:$(pwd):$(pwd)/brains
echo $PYTHONPATH
cd skybot; python bot.py;