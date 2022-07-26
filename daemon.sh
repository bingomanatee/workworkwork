#!/bin/bash

#
# Start the application and its prerequisites at localhost:8000, and
# automatically re-compile assets whenever any changes are made to
# them. You can stop the application running by pressing CTRL+C.
#

# Triggered when the user interrupts the script to stop it.
trap quitjobs INT
quitjobs() {
    echo ""
    pkill -P $$
    echo "Killed all running jobs".
    scriptCancelled="true"
    trap - INT
    exit
}

# Wait for user input so the jobs can be quit afterwards.
scriptCancelled="false"
waitforcancel() {
    while :
    do
        if [ "$scriptCancelled" == "true" ]; then
            return
        fi

        sleep 1
    done
}

# The actual commands we want to execute.

yarn start:prod

# Trap the input and wait for the script to be cancelled.
waitforcancel
return 0
