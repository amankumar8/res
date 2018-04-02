#!/usr/bin/env bash

# killall node
# mkdir -p ".meteor/logs/"
# LOGFILE=".meteor/logs/local.log"
# touch $LOGFILE
# meteor run --settings private/config/dev.json > $LOGFILE &

meteor run --settings config/settings/dev.json
