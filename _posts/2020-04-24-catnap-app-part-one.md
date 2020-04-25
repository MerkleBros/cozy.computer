---
layout: post
title:  "Catnap: Rest your eyes using Electron and systemd on Ubuntu (Part 1)"
date:   2020-04-24
draft: true
---

TLDR: An Electron app pops up a window periodically reminding me to rest my eyes. It's controlled with a systemd unit.

![gif of Electron app in action](assets/catnap-part-one-in-action.gif)

## Motivation
Recently I've been getting screen related headaches.

Some solutions to this problem via [American Academy of Ophthalmology (AAO)](https://www.aao.org/eye-health/tips-prevention/computer-usage):
1. Blink more often.
2. Use eye drops and increase the room humidity.
3. Get multi-focal prescription computer eyeglasses that allow easier focusing on intermediate distances (20-26inches from face).
4. Adjust screen brightness to match room's ambient lighting.
5. Get a matte screen filter to reduce glare.
6. Sit about arm's length from the screen.
7. **Follow the "20-20-20" rule: every 20 minutes, take a 20 second break by looking 20 feet away.**

A solution that [the Academy likes less](https://www.aao.org/eye-health/tips-prevention/are-computer-glasses-worth-it):
1. Filter blue light from your monitor. I use [Redshift](https://github.com/jonls/redshift) for this and it seems helpful even if the eye-doctors don't think so.

To make the head hurts go away I've started reminding myself to blink, using eye drops, and adjusting my screen brightness to match ambient lighting.

**Now I want to remind myself to follow the "20-20-20" rule.**

I'll do this by popping up a full-screen window every twenty minutes reminding me to rest my eyes. The window will be a small app for `Electron` - a framework for developing GUI's using Javascript.

The app is called `catnap` and will eventually feature pixelated images of napping cats. Here we'll just focus on a bare-bones version with some text.

### Project setup

My project structure:

```
/catnap/
- /app/ (contains Electron app files)
- /bin/ (contains a Bash script to periodically run the Electron app)
- /etc/ (contains a systemd unit file to run the Bash script and restart it when it fails)
- .gitignore
```

Setup the directory structure and track with Git (`mkdir` options `-p` to create parent directories even if they don't exist and `-v` to tell us what's happening):

```
mkdir -pv catnap/app catnap/bin catnap/etc && git init && touch .gitignore && echo "app/node_modules" > .gitignore
```

### What is Electron?

Electron is a minimal `Chromium` browser that you can control using `Javascript`.

`Chromium` is part of the source code for the `Chrome` browser - it includes user interface code, the `Blink` rendering engine, and the `V8 Javascript engine`.

Electron uses `Chromium` to create a web browser that mimics traditional desktop applications. You can use it to present users with desktop `Graphical User Interfaces (GUIs)` that you develop using web technologies (`Javascsript`, `HTML`, `CSS`) rather than the system's languages (`C/C++/Ojective C/Visual Basic/etc`).

An Electron application is setup like a `Node.js` application but it runs a local browser instead of a web server.

### Setting up the Electron app

The material in [Writing Your First Electron App Guide](https://www.electronjs.org/docs/tutorial/first-app) is mostly sufficient for `catnap`. All we need to do is pop up a window and display some HTML.

Inside the `app` directory, create a `package.json`:

```
{
  "name": "catnap",
  "version": "1.0.0",
  "description": "An app for resting your eyes and napping with cats",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "repository": "https://github.com/MerkleBros/catnap",
  "author": "Patrick McCarver",
  "devDependencies": {},
  "dependencies": {
    "electron": "^8.2.3"
  }
}
```

Electron looks at `main:` in `package.json` to decide how to start the app. If `main` is not provided then it will also try to find and run an `index.js` just like `Node.js` does.

#### main.js

`app/main.js` is below:

```
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const filePath = path.join('file://', __dirname, './index.html')
  let win = new BrowserWindow({ frame: false, fullscreen: true })
  win.on('close', () => { win = null })
  win.loadURL(filePath)
  win.show()
  return win;
}

function start() {
  let win = createWindow();
  setTimeout(() => {
    win.close()
  }, 20000)
}

app.whenReady().then(start)
```

Electron provides the `BrowserWindow` object for opening new browser windows. The `createWindow()` function finds the `index.html` file to put in the new window, initializes the browser window (fullscreen and without a frame, meaning no toolbars, URL bar, etc), sets up a `close` listener, loads the HTML into the browser window, and finally shows the window.

The `start()` function is called after the app is finished initializing. It calls `createWindow()` and then waits 20 seconds before closing the window.


The HTML that the window will show is in `app/index.html`:

```
<html>
  <body style="background-color: slategrey">
    <div
      style="color: white; font-size: 3.5vw; position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%);">
      Rest your eyes awhile.
    </div>
  </body>
</html>
```

Install Electron with `npm install` and run the app using `npm start`. A full-screen window will pop up for twenty seconds and then close:

![image of full-screen Electron app](assets/catnap-part-one-app.png)

### Launching the app every twenty minutes

We can use a Bash script to run the app periodically.

In `catnap/bin` run `touch catnap.sh && chmod u+x catnap.sh` to create a Bash script and make it executable.

Inside of `catnap.sh`, run a while loop that sleeps for twenty minutes (1200 seconds) and then launches the Electron app. Be sure to update the `cd` path to where your app is:

```
#! /usr/bin/env bash

set -Ceuo pipefail

while true
do
  (cd "$HOME/recurse/catnap/app/" && npm start)
  sleep 1200;
done
```

Run the script with `./catnap.sh`. The Electron app will open again, and after it closes you'll see that the process is still running (and taking up the terminal). If we waited twenty minutes it would open the Electron app again.

Let's run the process as a `daemon` - a background process - using `systemctl` (the `systemd` service controller). On Linux the `systemd` tool is used to manage processes on system startup and afterwards. [Here's another blog post explaining systemd](https://cozy.computer/run-bash-scripts-on-startup-using-systemd-on-ubuntu).

### Managing the process using systemd
We'll create a user `service` unit to manage the Bash script we just wrote. It will restart the script if it fails, and we can enable the script to run on startup under the systemd target `default.target`. Place the `service` file in `catnap/etc/catnapd.service` (`catnapd` for `catnap daemon`).
```
[Unit]
Description=Run the catnap app
After=default.target

[Service]
Restart=on-failure
RemainAfterExit=yes
ExecStart=/home/patrick/recurse/catnap/bin/catnap.sh

[Install]
WantedBy=default.target
```

Update `ExcStart=` to the path where you saved your `catnap.sh` script:

User services for systemd are stored in `~/.config/systemd/user/`.

Copy `catnapd.service` there (`cp catnapd.service ~/.config/systemd/user/`) and run `systemctl --user daemon-reload` to have `systemd` find the service.

Run the service using `systemctl --user start catnapd` and the Electron app should start again. Enable the service to start automatically on startup using `systemctl --user enable catnapd`.

Now `catnap.sh` is running in the background and managed by systemd.

You can stop the service any time using `systemctl --user stop catnapd` and disable it from running on startup using `systemctl --user disable catnapd`.

### Future work
Now we have a minimal Electron app to remind us to relax our eyes, a Bash script to launch that app every twenty minutes, and a systemd unit to start/stop the Bash script and enable/disable it on system startup.

Next time we'll add configuration files for user preferences like how often and how long to rest our eyes, track some state like total cat naps taken, and add an override to close the window early in case we're doing something important.
