---
layout: post
Title: "Using Vim as the manual pager on Ubuntu Linux"
Date: 2020-02-18
---

The default system pager in Ubuntu has keybindings that are difficult for me to remember. Since I work in Vim I wanted to open manual pages using that program instead.

## Manual pages
You can view manual pages in Linux using `man COMMAND_NAME` where `COMMAND_NAME` is typically the name of a `program, utility, or function`.

The program `man` calls itself the manual's `pager` - a [program used to read (and only read) text files](https://en.wikipedia.org/wiki/Terminal_pager) one page at a time. Confusingly, `man` is not the program that is actually paging the file though - `man` finds the source manual text file and passes it to a `pager` program that you can set.

You can read about the manual using `man man`.

### Where does man get manual pages?
To see where `man` looks for manual pages use `manpath`. Here's my `manpath`:

```
/home/patrick/.nvm/versions/node/v13.5.0/share/man:
/home/patrick/.local/share/man:
/usr/local/man:
/usr/local/share/man:
/usr/share/man:
/home/patrick/.fzf/man
```
You might notice that non-default programs like `node` and `fzf` are included if you have those installed. The `manpath` is built using `$PATH` to pick up custom manual pages and also some default directories from `/etc/manpath.config`.

The default directories for `manpath` to look (from `/etc/manpath.config`):

```
MANDATORY_MANPATH			/usr/man
MANDATORY_MANPATH			/usr/share/man
MANDATORY_MANPATH			/usr/local/share/man
```

It seems to look in every directory included in `$PATH` but some default places it looks are (from `/etc/manpath.config`):
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
To find the manual pages for a specific command use `man --where --all command_name`. For instance, `man --where --all node` shows the NodeJS manual pages at

```
/home/patrick/.nvm/versions/node/v13.5.0/share/man/man1/node.1
/usr/share/man/man1/node.1.gz
```

## Finding the default manual pager
From the manual, the default pager is an enigmatic program called `pager`:

![assets/using-vim-as-the-manual-pager-0.png](assets/using-vim-as-the-manual-pager-0.png)

Using `whereis pager` shows:

```
pager:
/usr/bin/pager
/usr/share/man/man1/pager.1.gz
```

The first path `/usr/bin/pager` is a symbolic link. There's a tool for resolving symbolic links called `readlink`. Using `readlink /usr/bin/pager` resolves to `/etc/alternatives/pager`.

This is still a symbolic link! But now we know about [Debian Alternatives System](https://wiki.debian.org/DebianAlternatives), which provides a system for selecting a default from a list of similar programs. This makes sense because there are many programs that could be used as a `pager`.

We can follow symbolic links recursively until it resolves to a real file using `readlink -f /usr/bin/pager` which gives us `/bin/less`.

Now we've proven what a simple Google search would tell us: `less` - a pager who's manual page describes it as `opposite of more` - is the default manual pager for Ubuntu

The second path is a `gzip` file. Manual files are called `nroff` files - meaning `new runoff`, a type of file used for printing formatted text. These files are saved as `compressed files` (`gzip (.gz)`) or with the extension `.1`.

## Customizing the manual pager using $MANPATH
From the manual's manual, `$MANPAGER` can be used to set a new system pager:

[!using-vim-as-the-manual-pager-1.png](assets/using-vim-as-the-manual-pager-1.png)

We can add `$MANPAGER` to our default Bash environment using `export`. The sample scripts I found for setting up pagers were using the `dash shell` located in `/bin/sh` and the `-c` flag which tells `dash` to read commands from a string.

We can try just setting `MANPAGER` to `vim` (`export MANPAGER="/bin/sh -c \"vim\""`) but that fails. Apparently you are meant to give pagers a better formatted version of the manual pages.

The `col` command "filters reverse line feeds from input" and is "useful for processing the output of `nroff(1)` (recall that manual pages are `nroff` documents)". Passing the pages through `col` and telling Vim to read the file from `stdin` using `-`:

```
export MANPAGER="/bin/sh -c \"col | vim -\""
```

The file is full of `^H`, which is [unicode](https://www.aivosto.com/articles/control-characters.html) for backspace.

[!using-vim-as-the-manual-pager-2.png](assets/using-vim-as-the-manual-pager-2.png)

To remove backspaces use `-b` flag with `col`:

```
export MANPAGER="/bin/sh -c \"col -b | vim -\""
```
[!using-vim-as-the-manual-pager-3](assets/using-vim-as-the-manual-pager-3.png)

Finally, `vim -c` will let us set some options for vim as a string. I'd like man files to be read-only and formatted better:
```
set
ft=man "filetype is man file
ts=8 "replace tabs with eight spaces
nomod "prevent file from being set as modified
nolist "list disables line breaks in older vim version
nonu "no line numbers
noma "buffer cannot be modified
linebreak "wrap lines at word boundaries
breakindent "indent wrapped lines
wrap "soft wrap (read-only) long lines
```

The final command can be placed in `.bashrc` to load in every shell:
```
export MANPAGER="/bin/sh -c \"col -b | vim -c 'set ft=man ts=8 nomod nolist nonu noma linebreak breakindent wrap' -\""
```

Now `man man` will open the `man` manual page with `vim`.

## Manual fuzzy finding
You can combine this with [fuzzy find](https://github.com/junegunn/fzf) (`fzf`) and `xargs` (a tool for parsing command line arguments correctly) to fuzzy search for man pages and open them with vim:

```
# Fuzzy find open man pages
fman() {
    man -k . | fzf --prompt='Man> ' | awk '{print $1}' | xargs -r man
}
```

[!using-vim-as-the-manual-pager-4](assets/using-vim-as-the-manual-pager-4.png)

## Fixing copy and paste
One caveat - my register and clipboard copying functionality doesn't work well on manual pages. I'm not sure why.

A work-around is to save the man-page as a temp file: `:w /tmp/temp_man_file.txt` and then open it in vim and copy as usual.
