---
layout: post
title:  "Custom tab colors in Firefox with userChrome.css"
date:   2020-04-26
draft: true
---

TLDR: Use the built-in [Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox#Enabling_the_Browser_Toolbox) to inspect UI elements in Firefox. Customize them in `userChrome.css` and place that file in a new directory `chrome` inside your Firefox profile which by default on Ubuntu is in `$HOME/.mozilla/firefox/bunch_of_numbers_and_letters.default/`. In the address bar type `about:config`, search for `userprof`, and set `toolkit.legacyUserProfileCustomizations.stylesheets` to `true`.

## Motivation
I switched Firefox to [dark mode](https://itsfoss.com/firefox-dark-mode/) but find that the active tab is too similar to the other tabs:

![image of dark mode tabs in Firefox](assets/custom-tab-colors-in-firefox.png)

Luckily you can use `css` to customize UI elements in Firefox. But how do we know what element to customize?

Can we inspect the UI elements in Firefox just like we inspect HTML on a web page? Yes!

## Browser Toolbox

Outline for rest of post
> Explanation of browser toolbox
> Inspecting using the browser toolbox
> Find active tab has an HTML attribute called `selected` with value `true`

## userChrome.css
> Background on word `chrome`
The [browser chrome](https://www.nngroup.com/articles/browser-and-gui-chrome/) is the collection of non-webpage UI elements that live around the page content - the browser's toolbars, tabs, URL bar, buttons, etc. This is not to be confused with `Google Chrome` - although the browser was maybe named ironically as its design philosophy was to [minimize the amount of chrome presented to the user](https://www.thewindowsclub.com/google-chrome-reason-revealed).

We can customize the `chrome` with a `css` file named `userChrome.css`.

The file must be placed in a `chrome` directory inside the directory for your Firefox profile. On Ubuntu with the default Firefox profile this is something like `$HOME/.mozilla/firefox/bunch_of_numbers_and_letters.default/`.

Create the `chrome` directory there and place `userChrome.css` inside `chrome`.
