---
layout: post
Title: "Manual pages and using Vim as the manual pager on Ubuntu Linux"
Date: 2020-02-24
---

The default system pager for viewing manual pages in Ubuntu has keybindings that are difficult for me to remember. Since I work in Vim I wanted to open manual pages using Vim instead.

## Manual pages
You can view manual pages in Linux using `man COMMAND_NAME` where `COMMAND_NAME` is typically the name of a `program, utility, or function`.

The program `man` calls itself the manual's `pager` - a [program used to read (and only read) text files](https://en.wikipedia.org/wiki/Terminal_pager) one page at a time. Confusingly, `man` is not the program that is actually paging the file though - `man` finds the source manual text file and passes it to a `pager` program that you can set.

You can read about the manual using `man man`.

### Where does man get manual pages?
To see where `man` looks for manual pages use the command `manpath`. Here's my `manpath` output:

```
/home/patrick/.nvm/versions/node/v13.5.0/share/man:
/home/patrick/.local/share/man:
/usr/local/man:
/usr/local/share/man:
/usr/share/man:
/home/patrick/.fzf/man
```
You might notice that non-default programs like `node` and `fzf` are included if you have those installed. The `manpath` is built using `$PATH` - to pick up custom manual pages - and also some default directories from `/etc/manpath.config`.

The default directories for `manpath` (from `/etc/manpath.config`):

```
MANDATORY_MANPATH			/usr/man
MANDATORY_MANPATH			/usr/share/man
MANDATORY_MANPATH			/usr/local/share/man
```

From `/etc/manpath.config`, `manpath` looks for program binaries (PATH column), and the places those manual pages actually end up (MANPATH column). It also seems to search in every path in `$PATH`.

```
#---------------------------------------------------------
# set up PATH to MANPATH mapping
# ie. what man tree holds man pages for what binary directory.
#
#		*PATH*        ->	*MANPATH*
#
MANPATH_MAP	/bin			/usr/share/man
MANPATH_MAP	/usr/bin		/usr/share/man
MANPATH_MAP	/sbin			/usr/share/man
MANPATH_MAP	/usr/sbin		/usr/share/man
MANPATH_MAP	/usr/local/bin		/usr/local/man
MANPATH_MAP	/usr/local/bin		/usr/local/share/man
MANPATH_MAP	/usr/local/sbin		/usr/local/man
MANPATH_MAP	/usr/local/sbin		/usr/local/share/man
MANPATH_MAP	/usr/X11R6/bin		/usr/X11R6/man
MANPATH_MAP	/usr/bin/X11		/usr/X11R6/man
MANPATH_MAP	/usr/games		/usr/share/man
MANPATH_MAP	/opt/bin		/opt/man
MANPATH_MAP	/opt/sbin		/opt/man
```

### Man page files for specific commands
To find the manual page source files for a specific command use `man --where --all command_name`. For instance, `man --where --all node` shows the NodeJS manual pages at

```
/home/patrick/.nvm/versions/node/v13.5.0/share/man/man1/node.1
/usr/share/man/man1/node.1.gz
```

Manual files are called `nroff` files - meaning `new runoff`, a type of file used for printing formatted text. These files are saved as `compressed files` (`gzip (.gz)`) or with the extension `.1`.

## Finding the default manual pager
From the manual, the default pager is an enigmatic program called `pager`:

![assets/using-vim-as-the-manual-pager-0.png](assets/using-vim-as-the-manual-pager-0.png)

Using `whereis pager` (use `whereis` to locate the binary, source, and manual page files for a command):

```
pager:
/usr/bin/pager
/usr/share/man/man1/pager.1.gz
```

The first path `/usr/bin/pager` is a symbolic link.

There's a tool for resolving symbolic links called `readlink`. Using `readlink /usr/bin/pager` resolves to `/etc/alternatives/pager` which is another symbolic link.

But now we know about [Debian Alternatives System](https://wiki.debian.org/DebianAlternatives), which provides a system for selecting a default program from a list of similar programs. This makes sense because there are many programs that could be used as a `pager`.

We can follow symbolic links recursively until it resolves to a real file using `readlink -f /usr/bin/pager` which gives us `/bin/less`.

Now we've proven what a simple Google search would tell us: `less` - a pager who's manual page describes it as `opposite of more` - is the default manual pager for Ubuntu

## Customizing the manual pager using $MANPATH
From the manual's manual, `$MANPAGER` can be used to set a new system pager:

![using-vim-as-the-manual-pager-1.png](assets/using-vim-as-the-manual-pager-1.png)

We can add `$MANPAGER` to our default Bash environment using `export`. The sample scripts I found for setting up pagers were using the `dash shell` located in `/bin/sh` and the `-c` flag which tells `dash` to read commands from a string (`export MANPAGER="/bin/sh -c \"DO_STUFF\""`).

We can try just setting `MANPAGER` to `vim` (`export MANPAGER="/bin/sh -c \"vim\""`) but that fails. Apparently you are meant to give pagers a better formatted version of the manual pages.

The `col` command is `"useful for processing the output of nroff(1)"` (recall that manual pages are `nroff` documents).

Passing the pages through `col` and telling Vim to read the file from `stdin` using `-`:

```
export MANPAGER="/bin/sh -c \"col | vim -\""
```

The file is full of `^H`, which is [unicode](https://www.aivosto.com/articles/control-characters.html) for backspace:

![using-vim-as-the-manual-pager-2.png](assets/using-vim-as-the-manual-pager-2.png)

To remove backspaces use `-b` flag with `col`:

```
export MANPAGER="/bin/sh -c \"col -b | vim -\""
```

It's close but not formatted well:

![using-vim-as-the-manual-pager-3](assets/using-vim-as-the-manual-pager-3.png)

Finally, `vim -c` lets us set options to improve the formatting and make the man pages read-only.

```
set
ft=man "filetype is man file
ts=8 "replace tabs with eight spaces
nomod "prevent file from being set as modified
nolist "list disables hard line breaks in older vim versions
nonu "no line numbers
noma "buffer cannot be modified
linebreak "wrap lines at word boundaries
breakindent "visually indent wrapped lines
wrap "soft wrap (visually wrap but don't enter a newline) lines
```

The final command can be placed in `.bashrc` (mine is in my home directory) to load in every shell:
```
export MANPAGER="/bin/sh -c \"col -b | vim -c 'set ft=man ts=8 nomod nolist nonu noma linebreak breakindent wrap' -\""
```

Now we can open nicely formatted man-pages with `vim`:

![using-vim-as-the-manual-pager-4](assets/using-vim-as-the-manual-pager-4.png)

## Manual fuzzy finding
You can combine this with [fuzzy find](https://github.com/junegunn/fzf) (`fzf`) and `xargs` (a tool for parsing command line arguments correctly) to fuzzy search for man pages and open them with vim:

```
# Fuzzy find and open man pages
fman() {
    man -k . | fzf --prompt='Man> ' | awk '{print $1}' | xargs -r man
}
```

![using-vim-as-the-manual-pager-5](assets/using-vim-as-the-manual-pager-5.png)

## Fixing copy and paste
My register and clipboard copying functionality doesn't work well on manual pages. I'm not sure why.

If you need to copy a man page, save the man-page as a temp file: `:w! /tmp/temp_man_file.txt` and then open it in vim and copy as usual.
