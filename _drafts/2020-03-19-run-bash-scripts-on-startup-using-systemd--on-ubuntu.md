---
layout: post
title:  "Run Bash scripts on startup using systemd on Ubuntu"
date:   2020-03-19
---
### Motivation
I use a [tiling window manager called i3](https://i3wm.org/) which mostly does away with Ubuntu's default configurations.

One side-effect of my `i3` setup is that on startup the screen resolution is always set to its native resolution which makes text way too small.

I wrote a configuration file for `i3` to fix this but it either doesn't run or seems to get overwritten by another process that also changes the screen resolution (probably `X11 Window Manager`).

I read that you can fix this using an `~/.xsessionrc` file - but this file can also be overridden by other programs.

Instead I decided to fix the screen resolution by automatically running a `Bash` program on startup using `systemd`.

### Background on systemd
#### systemd and the init process
`systemd` is a process manager for Linux. It's in charge of running `units` which are abstractions for various startup and maintenance tasks. Manual files for `systemd` can be found using `man systemd`.

When Linux boots, `systemd` will start a process called `init` which all other 'user-space' (non-kernel-related) processes are spawned from.

Using `htop` (an interactive process viewer) and viewing in tree mode we can see that all processes are spawned by either `init (systemd)` or by `kthreadd (kernel thread daemon)`:

![image of htop collapsed to PID 1 and 2](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

These processes have `PIDs` (Process IDs) `1 (init/systemd)` and `2 (kthreadd)` and it's implied that they are started by the kernel's process scheduler which is not shown but could be represented by `PID 0`.

Even though we can't see `PID 0`, using `ps (process snapshot)` we can still see that the `Parent Process ID (PPID)` is `0` for process `1 (init)` and `2 (kthreadd)` by running `ps -f 1 2`:

```
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0 Mar18 ?        00:00:09 /sbin/init splash
root         2     0  0 Mar18 ?        00:00:00 [kthreadd]
```

The `kthreadd` process is in charge of communicating with the underlying hardware.

The `init/systemd` process is in charge of running higher-level programs and daemons (background processes).

#### systemd units
`Units` are the fundamental abstraction for `systemd`.

Units are defined in `unit configuration files`. These files describe various objects and processes that are used during system startup and while the system is running.

There are eleven types of `units` that `systemd` can manage:

```
1.  Service units - for controlling daemons and processes
2.  Socket units - for managing local and network sockets
3.  Target units - for grouping units or marking steps in the system state
4.  Device units - for controlling system devices
5.  Mount units - for controlling file system mount points
6.  Automount units - for on-demand file mounting
7.  Timer units - for triggering other units
8.  Swap units - for memory swap partitions
9.  Path units - for watching the filesystem for changes
10 .Slice units - for grouping units
11. Scope units - for managing foreign processes
```

We'll focus on running a `service unit` and also explore `timer units` for triggering that service unit. A `target unit` will be used to run the `service unit` in the correct spot during system startup.

#### systemd unit tree
Units in systemd are arranged in a tree hierarchy to determine the order they're run in. Units can be arranged to startup up before, after, or in parallel with other units. Along the way, intermediate `target units` are reached which specify that a certain group of `units` have been run.

These `target units` replace `RUN levels` from earlier version of Linux which were used to describe what state of startup the system was in.

The `runlevel` command returns the last two system runlevels: `N 5`.

Here `5` is the current run level. From `man runlevel` we can see that runlevel 5 corresponds to the systemd `target unit` of `graphical.target`:

![image of table mapping runlevel to systemd targets](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

The table only shows six run levels. But because systemd uses `target units` instead, we can have as many intermediate system states as we want during startup. This is why `runlevel` returns `N` for the previous runlevel - there is no corresponding runlevel for the system state before this one because there are many more `target units` than there are `runlevels`.

Note that `units` can belong to the `system` or to the `user`. There are separate unit trees for both and units from one tree cannot depend on the other.

#### systemd-analyze for viewing the unit tree
Section 1 of the manual (executable programs) has many command-line tools beginning with `systemd-`:

![image of fuzzy find man pages for systemd-](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

One is `systemd-analyze` - a tool for analyzing performance data for systemd, debugging systemd, and visualizing the unit tree.

Running `systemd-analyze` shows how long the last startup took, where `kernel` time is time the machine took to boot up and `userspace` time is time that `systemd` took to start up:

```
Startup finished in 2.918s (kernel) + 8.440s (userspace) = 11.359s
graphical.target reached after 8.427s in userspace
```

We can visualize all of the units that ran during the last startup and see how long each one took to initialize using `systemd-analyze plot` which will save an `.svg` plot for us. Run `systemd-analyze plot > systemd-plot.svg` and open the svg using `xdg-open systemd-plot.svg`. Part of my system plot is shown below:

![image of svg plot with startup units and runtimes](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

Processes that are starting up are shown in dark red and processes that successfully started are shown in light red.

We can see that `systemd` does not start until after the kernel finishes loading, which makes sense because the kernel is the one that launches systemd.

During startup the system reaches various states marked by various `target units`. The final three `target units` are `network-online.target`, `multi-user.target`, and `graphical.target`:

![image of end of systemd-analyze plot](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

Notice how `network-online.target` is only achieved after `NetworkManager-wait-online.service` - a service to connect to the network - finishes starting up. This is an excellent example of using `target units` to mark system state. The `network-online.target` is only activated once the system is connected to the network. This target lets network-dependent services like `docker.service` know they can startup.

From the graph it appears that `graphical.target` is systemd's final system state on startup because it is the final `target unit` on the graph.

#### systemctl for viewing and managing systemd units

The `systemctl (system control)` command-line tool can be used to manage systemd `units`. It uses the syntax `systemctl [action] [unitName]`. Some useful commands:
- `systemctl start unitName` to start (activate) a system unit to run the unit once or start a daemon
- `systemctl stop unitName` to stop (deactivate) a running unit or daemon
- `systemctl status unitName` to check whether a unit is running and to view the most recent log data from the unit
- `systemctl enable unitName` to make a unit start on startup and setup symbolic links for systemd to function correctly
- `systemctl disable unitName` to prevent a unit starting on startup and remove symbolic links for that unit
- `systemctl reenable unitName` is equivalent of `disable` and then `enable`

We can use `systemctl` to see the default `target unit` that systemd tries to reach during startup with `systemctl get-default`:

```
graphical.target
```

This confirms the hypothesis above that `graphical.target` is the final system state during startup.

Running `systemctl` by itself shows all active systemd units.

We can view all installed units on the system (whether active or inactive) with `systemctl list-unit-files`.

You can also filter the list of units by one of the eleven type with the `--type` flag. Let's view all `target units` on the system using `systemctl list-unit-files --type=target`:

![image of all targets on system](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

You can view the dependency tree for a unit using `systemctl list-dependencies unitName`. Since we know that `graphical.target` is the final system state, we expect it depends on almost all other units. Use `systemctl list-dependencies graphical.target` to see a tree of units that `graphical.target` depends on. It will show a list of all units that `systemd` will activate in order to reach the `graphical.target` state:

![image of graphical.target dependencies](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

Deeper nodes in the tree generally represent programs that are run earlier in the startup sequence.

#### Viewing user units
All of the systemctl commands are for `system` units by default. But there are also `user` units which belong to their own unit tree. To view information for `user` units you can run most `systemctl` commands with the `--user` flag.

#### systemd unit files
Units are described in configuration files named following the convention `unitName.unitType`. So in `graphical.target`, the unit named `graphical` has unit type `target`.

From the manual (`man systemd.unit`), system unit files are located in the following directories:

![image of directories where system unit files are located](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

User unit files are located in these directories:

![image of directories where user unit files are located](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

For both `system` and `user` unit files, you are free to save them anywhere, as long as they are `symbolic linked` back into one of the directories above where systemd looks for unit files.

You can open unit files directly or have `systemctl` print them using `systemctl cat unitName`. Here's the contents of `graphical.target` (notice the first line describes where the unit file is located, and that it's one of the directories where system unit files are supposed to be located):

```
# /lib/systemd/system/graphical.target
#  SPDX-License-Identifier: LGPL-2.1+
#
#  This file is part of systemd.
#
#  systemd is free software; you can redistribute it and/or modify it
#  under the terms of the GNU Lesser General Public License as published by
#  the Free Software Foundation; either version 2.1 of the License, or
#  (at your option) any later version.

[Unit]
Description=Graphical Interface
Documentation=man:systemd.special(7)
Requires=multi-user.target
Wants=display-manager.service
Conflicts=rescue.service rescue.target
After=multi-user.target rescue.service rescue.target display-manager.service
AllowIsolate=yes
```

Unit files are groups of `key=value` pairs broken up into sections. Typical sections include:
- `[Unit]` for describing generic information about the unit including its dependencies
- `[Install]` for describing how to set up the unit when it is enabled using `systemctl enable unitName`
- A section specific to the type of unit. For instance, `[Service]` for `.service` files, `[Timer]` for `.timer` files, `[Socket]` for `.socket` files, etc.

Note that `target` unit files do not have a special `[Target]` section because `target` units are only intended to group other units or act as milestones for system states.

### Building and installing a systemd unit for fixing screen resolution
Recall that I'd like to run a bash script during startup that fixes my screen resolution.

The `service` unit type - for controlling daemons and processes - seems appropriate for this.

Learn more about `service` unit types from the manual (`man systemd.service`):

I decide that this service can be a `user` unit rather than a `system` unit because I want the unit to run when I log in rather than when the system boots.

I decide to save my unit in `~/.config/systemd/user/` after examining the list of directories where systemd looks for user units (see above).

#### fixresolution.sh
The bash script for setting my screen resolution:

```bash
#! /usr/bin/env bash
set -Ceuo pipefail
xrandr --output eDP1 --mode 1920x1080
```

The line `set -Ceuo pipefail` is just for handling errors.

The script uses `xrandr` - a command-line interface for setting screen size, orientation, and resolution - to set my screen resolution.

Running `xrandr` on its own will show you what screens your system recognizes, their current and available resolutions, and whether they are connected or not. Each screen is named something like `eDP1, DP1, HDMI1, HDMI2`, etc.

Replace the `--output eDP1` with the name of your monitor and `--mode 1920x1080` with your desired resolution.

Save `fixresolution.sh` somewhere in your home directory and make it executable with `chmod u+x fixresolution.sh`.

Test the script by changing your resolution to something non-ideal like `xrandr --output yourMonitorName --mode 1024x768` and then running `. fixresolution.sh` to set it back to the desired resolution.

#### fixresolution.service
We'll build a `service` unit to run `fixresolution.sh` on startup.

Paste the following into `~/.config/systemd/user/fixresolution.service`, updating `ExecStart=` to the path where you saved `fixresolution.sh`:

```bash
[Unit]
Description=Fix startup screen resolution
After=default.target

[Service]
Type=idle
RemainAfterExit=yes
ExecStart=/home/patrick/recurse/bash-scripts/systemd-fix-resolution/fixresolution.sh

[Install]
WantedBy=default.target
```

Running `systemctl --user get-default` shows that the final target system state for user units is `default.target` - we'll run our script after that target is reached. Hopefully most startup tasks have been completed by then and won't overwrite our resolution settings again.

All units can have a `[Unit]` section for generic unit settings.

Available settings for `[Unit]` are available in `man systemd.unit`. The ones I use:
- `Description=Fix startup screen resolution` is a short description of the unit for UI and logs to display
- `After=default.target` will run this unit after the unit `default.target` is reached.

Services need to know what program to run. This is defined with `ExecStart=path/to/your/program`.

Services can have `types`, a few types are:
- `simple` services expect to run one process (`systemctl` will assume that process is a daemon and keep track of it)
- `forking` services expect that a child process is created (`systemctl` will assume the child process is a daemon and keep track of it)
- `oneshot` services expect the process to run once and then close (`systemctl` assumes no daemons are created but still tracks the process)
- `idle` services are like `simple` but until all active processes are complete (up to 5 seconds)

I chose the `idle` type because the script should try to run after everything else so that nothing else overwrites my screen resolution.

Service `unit files` have a `[Service]` section with service related settings:
- `Type=idle` sets type to `idle`
- `RemainAfterExit=yes` marks my service as `active` even after the script has finished running. We can use `systemctl` to examine the process even after it has finished running.
- `ExecStart=/home/patrick/recurse/bash-scripts/systemd-fix-resolution/fixresolution.sh` has the path to my bash script

All units may have an `[Install]` section for setting up the unit using `systemctl enable`. This section tells where the unit will be placed in the `unit` tree:
- `WantedBy=default.target` means that this service will start when `default.target` is started (it will be made a direct child of `default.target`).

#### Unit dependencies
Units can be made to depend upon one another in complex ways.

Some common ways to state dependencies and run orders for our unit (the unit we are writing the configuration file for). These all go in the `[Unit]` section:
- `Before=someUnit` finishes running our unit before running `someUnit`
- `After=someUnit` runs our unit after finishing running `someUnit`
- `Wants=someUnit` runs `someUnit` when our unit is run (they can be run at the same time)
- `Requires=someUnit` runs our unit only if `someUnit` can be sucessfully started

#### Running fixresolution.service
Our service is now saved at `~/.config/systemd/user/fixresolution.service` but systemd needs to rescan the directories where it looks for unit files.

Run `systemctl --user daemon-reload` to scan for new unit files.

Confirm that `systemctl` found the new service using `systemctl --user status fixresolution`;

![image of status for fixresolution](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

Change your screen resolution again using `xrandr --output yourMonitorName --mode 1024x768` and run `systemctl --user start fixresolution`.

If the service runs successfully your resolution should be reset to your ideal resolution.

#### systemctl enable
Units can be set to run automatically on startup using `systemctl enable unitName`.

`systemctl enable` does two things:
- it creates directories with names that describe our dependencies by reading from the `[Install]` section
- it places a `symbolic link` representing our service inside those directories

This directory structure locates our `unit` in the unit tree that systemd uses to determine run order on startup.

Running `systemctl --user enable fixresolution` will create a directory describing the dependency for `fixresolution`:

```
Created symlink /home/patrick/.config/systemd/user/default.target.wants/fixresolution.service → /home/patrick/.config/systemd/user/fixresolution.service
```

The `default.target.wants` directory means that our service will be run when `default.target` is started.

We can see that `fixresolution` is successfully placed in the unit tree by running `systemctl --user list-dependencies default.target`:

![image showing fixresolution as a child unit of default.target](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

The service should now run on startup (except that it's not right yet!).

#### Testing the fixresolution service on startup
