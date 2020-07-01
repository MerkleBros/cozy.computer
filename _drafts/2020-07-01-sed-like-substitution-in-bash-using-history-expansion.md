---
layout: post
title:  "Sed-like substitution in Bash using history expansion"
date:   2020-07-01
draft: true
---
TLDR: You can use Bash history expansion to quickly substitute all occurrences of one word with another word using sed-like syntax (`:s/old_word/new_word`). For example, if you just ran `mkdir -vp this/this/this/this/this`, immediately run `!!:gs/this/that/` to run `mkdir -vp that/that/that/that/that`. Print the result of your substitution without actually running the command using `:p`, ex `!!:gs/this/that/:p`.

## Bash History Expansion

Bash saves commands you run in `Bash history`. To see Bash history type `history` (or `Ctrl-r` to interactively search through history).

Bash has some syntax rules - called `history expansion` - that you can use to select lines from the history. Once you've selected a line you can re-run that command, modify that command, or select parts of that command for use in a different command.

To read more use `man bash` and search for `history expansion`.

### Syntax
`History expansion` has a simple three-part syntax composed of `event designator`, `word designator (optional)`, and a series of `modifiers`. The parts of the history expansion fit together like this:

```
!EVENT_DESIGNATOR:OPTIONAL_WORD_DESIGNATOR:MODIFIER_ONE:MODIFIER_TWO:MODIFIER_N
```

where `!` signals the start of a `history expansion`.

#### Event designators
The `event designator` selects the line from history to use.

Some event designators:
- `!n` to select command `n` from the `history` list
- `!-n` to select a command `n` lines back in the history list
- `!!` to select the last executed command in the history list
- `!abc` to select the most recent command starting with the string `abc`
- `!?abc?` to select the most recent command containing the string `abc`

#### Word designators
You can select words from a command instead of selecting the entire command.

Some word designators:
- `0` to select the first word (usually the command word ex `ls`)
- `n` to select the nth word.
- `^` to select the first argument (usually word 1)
- `*` to select all words except the first word

#### Modifiers
You can perform various operations on a selected command or word. These operations are designated with a single letter (except for the substitution operation) and you can use as many as you want, just add each one to the end of the command separated by a colon.

Some modifiers:
- `t` remove all leading file components (ex to strip `/dir1/dir2/dir3` from `/dir1/dir2/dir3/myfile.txt`)
- `r` remove a trailing suffix (ex strip `.txt` from `myfile.txt`)
- `p` to print the modified command but don't execute it
- `s/old/new/` to replace the first occurrence of string `old` with string `new` in the selected command
- `gs/old/new/` to replace all occurrences of string `old` with string `new` in the selected command

### Examples
#### Example one
I can get the word count of a story I like:

```
wc kelly-link/TravelswiththeSnowQueen-KellyLink.md
```

Then to print (`:p`) the file name without leading components (`:t`) and without its suffix (`:r`), I select the last command that I ran (`!!`) and select the first word from that command (`:1`):

```
!!:1:t:r:p
```

The above command prints `TravelswiththeSnowQueen-KellyLink`. The `!!` is the `event designator`, the `1` is the `word designator`, and the `t,r,p` are modifiers.

#### Example two
Say I have a long command like this:

```
mkdir -vp this/this/this/this/this/this/is/a/new/directory && \
touch this/this/this/this/this/this/is/a/new/directory/thing.txt
```

Now I want to run that command again, but replace all of the `this` with `that`. I'll test that the substitution works by using the modifier `:p` so that it prints the modified command but doesn't execute it yet. I'll select the last command (`!!`) and replace all occurrences of `this` with `that` (`:sg/this/that/`).

Note that this history expansion leaves out the optional word designator since I'm selecting the entire command.

```
!!:gs/this/that/:p
```

This will print the result of our substitution:

```
mkdir -vp that/that/that/that/that/that/is/a/new/directory && touch that/that/that/that/that/that/is/a/new/directory/thing.txt
```

It will also put the printed command into the command history (which is unexpected!) - this means you can execute the new command using `!!`.
