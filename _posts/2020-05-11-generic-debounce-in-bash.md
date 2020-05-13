---
layout: post
title:  "Generic debounce in Bash"
date:   2020-05-11
draft: true
---
TLDR: A [short Bash script (Github link)](https://github.com/MerkleBros/debounce.sh) for debouncing using a while loop and processes management.

![gif of script running on command line](assets/generic-debouncing-in-bash.gif)

## Motivation
I wanted to automatically push my technical journal to Github whenever I saved it, but only if I hadn't saved it recently (since I tend to save every time I exit insert mode). Debouncing works for this - I'll only push to Github when I save but don't save again for awhile.

## What is debouncing?
__Debouncing__ is the process of taking multiple sequential events of the same type and grouping them together as one. By treating a group of events as one event, you can handle them all at once instead of handling each event individually.

Debounce is often used in front-end design for things like autosaving a form that a user is typing in - but only after they have finished typing for some time (all keypress events are grouped together and treated as one).

Debouncing requires an __event generating program__ and an __action__ to run when the event generating program has stopped generating events for a certain __time interval__.

[CSS Tricks](https://css-tricks.com/debouncing-throttling-explained-examples/#article-header-id-0) explains it through analogy:

> Imagine you are in an elevator. The doors begin to close, and suddenly another person tries to get on. The elevator doesn’t begin its function to change floors, the doors open again. Now it happens again with another person. The elevator is delaying its function (moving floors), but optimizing its resources.

The event generating program is `people boarding the elevator`. The action to be performed when people stop boarding the elevator is to `move floors`. But the elevator can only move floors when people have not boarded the elevator for a certain `time interval`.

## Debounce.sh

The script `debounce.sh` is given below.

It runs a passed in program repeatedly. Every time that program exits successfully it launches a child process that will run a passed in action after some amount of time has passed. If the program exits successfully again before that time has passed, the child process is replaced by a new child process. When the given program stops exiting successfully for long enough, the surviving child process will finally execute its action.

```
#! /usr/bin/env bash
set -Ceuo pipefail

readonly DEBOUNCE_PROGRAM="${1}"
readonly DEBOUNCE_INTERVAL_SECONDS="${2}"
readonly DEBOUNCE_ACTION="${*:3}"
debounce_action_pid=""

debounce_action() {
    # echo "Waiting debounce interval to perform debounce action: ${DEBOUNCE_ACTION}"
    sleep $((DEBOUNCE_INTERVAL_SECONDS))
    # echo "Running debounce action"
    bash -c "${DEBOUNCE_ACTION}"
}

debounce () {
    while
        "${DEBOUNCE_PROGRAM}"
    do
        # echo "DEBOUNCE PROGRAM RAN AT ${SECONDS} SECONDS"
        if test -n "${debounce_action_pid}" && ps -p "${debounce_action_pid}" > /dev/null; then
            # echo "Killing debounce_action with PID: ${debounce_action_pid}"
            kill "${debounce_action_pid}"
        fi
        debounce_action &
        debounce_action_pid="${!}"
    done
}

debounce
```

### Positional arguments
It takes three `positional arguments` - arguments that you pass into the script via the command line:

1. `DEBOUNCE_PROGRAM`: a program that you want to run continuously but that periodically returns successfully when an event occurs (ex a file watcher like `inotifywait` that returns successfully when a file is changed).
2. `DEBOUNCE_INTERVAL_SECONDS`: a time interval in seconds to wait when the debounce program returns successfully
3. `DEBOUNCE_ACTION`: a program that runs when the `DEBOUNCE_PROGRAM` has not returned successfully for `DEBOUNCE_INTERVAL_SECONDS` seconds.

These arguments are `readonly` which is a way to set constants in Bash. They are read in respectively as `$1`, `$2`, and `$*:3` where `$*:3` is a concatenation of every parameter after the first two.

### Functions
The script has two functions: `debounce` and `debounce_action`.

The `debounce_action` function just sleeps (does nothing) for `DEBOUNCE_INTERVAL_SECONDS` and then runs our supplied action `DEBOUNCE_ACTION` with `bash -c "${DEBOUNCE_ACTION}"`. It will be run as a child process in the `debounce` function.

The `debounce` function runs a `while` loop. Bash while loops - and Bash conditionals in general like `if` statements - run a process and evaluate that process's as `truthy` if that process returns `0`. Our while loop repeatedly runs the passed in program `DEBOUNCE_PROGRAM` until it returns a non-zero number.

Each time `DEBOUNCE_PROGRAM` is run and returns `0`, the `do` loop is executed. It checks whether we've launched a child process yet - kills that child process if it exists - and then launches a new child process by running the `debounce_action` function in the background with `debounce_action &`. The child process's `pid` - process ID - is saved as `debounce_action_pid` so that we can replace it later if the `DEBOUNCE_PROGRAM` triggers again before the `debounce_action` has fired.

### Usage
Pass the three parameters in order to debounce.sh (`DEBOUNCE_PROGRAM`, `DEBOUNCE_INTERVAL_SECONDS`, `DEBOUNCE_ACTION`).

Generic usage:

```
./debounce.sh ./debounce_program.sh debounce_interval_seconds ./debounce_action.sh
```

Watch standard input with `read` and print "Ran action" whenever text has been submitted to standard input but not submitted again for 5 seconds.

```
./debounce.sh "read" 5 "echo 'Ran action'"
```
