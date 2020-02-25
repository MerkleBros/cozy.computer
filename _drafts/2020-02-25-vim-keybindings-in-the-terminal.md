---
layout: post
title:  "Vim keybindings in the terminal"
date:   2020-02-25
---

## Setting vi or emacs mode in Bash
You can edit and navigate the Bash command line using simplified `vi` or `emacs` keybindings.

In your `.bashrc`, use `set -o vi` for `vim-like` or `set -o emacs` for `emacs-like` navigation where the `-o` flag is for `options`.

## Default keybindings for vi
### Insert mode
New command lines will start in insert mode which behaves similarly to the regular terminal (but is annoying for vim users).

### Normal mode
Use `escape` to return to normal mode (I've remapped this to `jk`, see below).

In normal mode, you can navigate using familiar keybindings:

- `l` move forward a letter
- `h` move back a letter
- `w` move forward a word
- `b` move back a word
- `e` move to end of word
- `0` move to front of line
- `$` move to back of line
- `i` insert mode
- `A` insert mode at end of line
- `I` insert mode at front of line
- `r` replace letter under cursor
- `x` remove letter under cursor
- `dd` delete line
- `d movement` delete to movement
- `yy` yank line
- `p` paste yanked text

Note that yanking and pasting in Bash doesn't use the system clipboard.

You can use `v` to open the current command in your default `$EDITOR` (hopefully set to `vim`) and edit the command there. This is useful for working with large commands and for copying to the system clipboard. Save and exit the file to run the command.

WARNING: even if you don't save, it will still run the command that was present on the command line when you opened the editor. The easiest way to avoid this is to just close the terminal.

You can navigate history using `j` for newer commands and `k` for older commands.

## Custom keybindings for vi mode
To list customizable actions and corresponding keybindings use `bind -P`. The `vi` related ones begin with `vi-`:

```
vi-append-eol is not bound to any keys
vi-append-mode is not bound to any keys
vi-arg-digit is not bound to any keys
vi-back-to-indent is not bound to any keys
vi-backward-bigword is not bound to any keys
vi-backward-word is not bound to any keys
vi-bword is not bound to any keys
vi-bWord is not bound to any keys
vi-change-case is not bound to any keys
vi-change-char is not bound to any keys
vi-change-to is not bound to any keys
vi-char-search is not bound to any keys
vi-column is not bound to any keys
vi-complete is not bound to any keys
vi-delete is not bound to any keys
vi-delete-to is not bound to any keys
vi-editing-mode is not bound to any keys
vi-end-bigword is not bound to any keys
vi-end-word is not bound to any keys
vi-eof-maybe can be found on "\C-d".
vi-eword is not bound to any keys
vi-eWord is not bound to any keys
vi-fetch-history is not bound to any keys
vi-first-print is not bound to any keys
vi-forward-bigword is not bound to any keys
vi-forward-word is not bound to any keys
vi-fword is not bound to any keys
vi-fWord is not bound to any keys
vi-goto-mark is not bound to any keys
vi-insert-beg is not bound to any keys
vi-insertion-mode is not bound to any keys
vi-match is not bound to any keys
vi-movement-mode can be found on "\C-x\C-a", "\e", "jk".
vi-next-word is not bound to any keys
vi-overstrike is not bound to any keys
vi-overstrike-delete is not bound to any keys
vi-prev-word is not bound to any keys
vi-put is not bound to any keys
vi-redo is not bound to any keys
vi-replace is not bound to any keys
vi-rubout is not bound to any keys
vi-search is not bound to any keys
vi-search-again is not bound to any keys
vi-set-mark is not bound to any keys
vi-subst is not bound to any keys
vi-tilde-expand is not bound to any keys
vi-unix-word-rubout can be found on "\C-w".
vi-yank-arg is not bound to any keys
vi-yank-pop is not bound to any keys
vi-yank-to is not bound to any keys
```

In your `.bashrc`, use `bind '"YOUR_KEYBINDING":action'` where `action` is from the list above.

I've bound `jk` to return to normal mode, and `zj` to `enter` because my wrist doesn't like hitting the enter key:

```
# Use vi keybindings
set -o vi
bind '"jk":vi-movement-mode'
bind '"zj":accept-line'
```

## Vi keybindings in other Bash-like programs
Thanks to [Arabesque](https://sanctum.geek.nz/arabesque/vi-mode-in-bash/), I discovered that many programs use `readline` to get lines from a user using a terminal prompt. You can use `vi-like` keybindings in programs that use `readline` besides Bash.

Create a `.inputrc` file in your home directory and inside put `set editing-mode vi`.

Restart your computer and you can use vi-keybindings in other programs like `MYSQL` and `Python3`.
