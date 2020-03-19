---
layout: post
title:  "Run Bash scripts on startup using systemd on Ubuntu"
date:   2020-03-19
---
#### Motivation
I use a [tiling window manager called i3](https://i3wm.org/) which mostly does away with Ubuntu's default configurations.

One side-effect of my `i3` setup is that on startup the screen resolution is always set to its native resolution which makes text way too small.

I wrote a configuration file for `i3` to fix this but it either doesn't run or seems to get overwritten by another process that also changes the screen resolution (probably `X11 Window Manager`).

I read that you can fix this using an `~/.xsessionrc` file - but this file can also be overridden by other programs.

Instead I decided to fix the screen resolution by automatically running a `Bash` program on startup using `systemd`.

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
Units are described in configuration files. See the documentation for unit files using `man systemd.unit`.

From the manual, system unit files are located in the following directories:

![image of directories where system unit files are located](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

User unit files are located in these directories:

![image of direcotires where user unit files are located](assets/removing-weirdly-named-files-using-inodes-on-ubuntu-0.png)

Either way, you are free to save your unit files wherever you would like, as long as they are `symbolic linked` back into one of the directories where systemd looks for unit files.

You can open unit files directly or have `systemctl` print them.
