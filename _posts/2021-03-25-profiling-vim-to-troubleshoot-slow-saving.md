---
layout: post
title:  "Profiling vim to troubleshoot slow saving"
date:   2021-03-25
---

TLDR: Use profiling in vim ([try this stackoverflow post](https://stackoverflow.com/questions/12213597/how-to-see-which-plugins-are-making-vim-slow)) to see which functions are slowing things down. Function calls are sorted by time at the bottom of the profile file.

## Motivation
I've been keeping a personal journal that has grown to 24,000 lines of markdown. I edit this file in `vim`. For some reason vim has started to slow down while saving my personal journal. Sometimes it will hang for several seconds!

I'd like to profile vim to find the cause of this slowdown and fix it.

### Profiling in vim
[Stackoverflow: How to see which plugins are making vim slow](https://stackoverflow.com/questions/12213597/how-to-see-which-plugins-are-making-vim-slow):

```
:profile start profile.log
:profile func *
:profile file *
" At this point do slow actions (saving in my case)
:profile pause
:noautocmd qall! "(patrick note: or just :q)
```

The `:profile` command in vim lets you measure the time vim spends executing functions and scripts. Use `help profile` to read more about it.

- The profile is written in the current directory to `file_name` using `:profile start file_name`.
- Then you can profile functions by name `:profile func function_name` or profile all functions `:profile func *`.
- Likewise, you can profile a script file `:profile file file_name` or profile all included script files `:profile file *`.
- `:profile pause` stops profiling

### Examining the profile
I ran these three commands to save a profile of all files and functions to `profile.log`:

```
:profile start profile.log
:profile func *
:profile file *
```

Then I typed a little bit, tried to save, and stopped profiling:

```
:profile pause
:q
```

At the end of the generated `profile.log` file, the functions are sorted by time. You can view times sorted by `self time` or `total time`.
- `self time` is the time a function spent running its own code
- `total time` is the time a function spent running its own code + the time the function spent calling other functions, scripts, autocommands, and shell commands

Profiled times sorted by total time:

```
FUNCTIONS SORTED ON TOTAL TIME
count  total (s)   self (s)  function
    3   1.200874   0.373631  <SNR>153_RunFixer()
    2   0.641884   0.000043  <SNR>153_RunJob()
    1   0.566108   0.000061  ale#events#SaveEvent()
    1   0.566016   0.002133  ale#fix#Fix()
    1   0.456418             ale#fixers#generic#TrimWhitespace()
    1   0.154260   0.000056  <SNR>48_SyncAutocmd()
    1   0.154204   0.000073  coc#rpc#request()
    1   0.154106   0.145006  <SNR>51_request()
    1   0.088721   0.023383  ale#fix#ApplyFixes()
    1   0.065313   0.053214  ale#fix#ApplyQueuedFixes()
    3   0.032410   0.000563  gitgutter#process_buffer()
    1   0.030121   0.002831  gitgutter#diff#run_diff()
    1   0.025621             <SNR>144_write_buffer()
    7   0.020929   0.000130  airline#extensions#wordcount#get()
    1   0.020799   0.000037  <SNR>103_update_wordcount()
    1   0.020762             <SNR>103_get_wordcount()
    7   0.016665   0.000341  airline#extensions#branch#get_head()
    7   0.016041   0.000544  airline#extensions#branch#head()
    6   0.014560   0.001404  coc#api#call()
    2   0.014501   0.000200  <SNR>114_Lint()
```

It looks like most of the time is spent running `<SNR>153_RunFixer()`, `<SNR>153_RunJob()`, `ale#events#SaveEvent()`, `ale#fix#Fix()`, `ale#fixers#generic#TrimWhitespace()`.

These are all related to my linter `ALE`.

The profiler breaks down each function that was run during profiling so you can see what lines of code are slowing things down. For instance, here's `ale#fixers#generic#TrimWhitespace()`:

```
FUNCTION  ale#fixers#generic#TrimWhitespace()
Called 1 time
Total time:   0.456418
 Self time:   0.456418

count  total (s)   self (s)
    1              0.000004     let l:index = 0
    1              0.000772     let l:lines_new = range(len(a:lines))

24386              0.016418     for l:line in a:lines
24385              0.394273         let l:lines_new[l:index] = substitute(l:line, '\s\+$', '', 'g')
24385              0.027497         let l:index = l:index + 1
24385              0.012589     endfor

    1              0.000003     return l:lines_new
```

My linter spends `0.45 seconds` scanning all `24386` lines of my journal to try and remove whitespace from the end of each line every time I save! It probably doesn't need to do that!

### Solution
I turned off `linting` (checking for code problems) and `fixing` (actually fixing the problems) for my personal journal using an ale option in my `.vimrc`:

```
" Don't use ALE on my personal journal
let g:ale_pattern_options = {
\   '/home/patrick/writing/recurse-journal/recurse-journal.md': {'ale_enabled': 0, 'ale_fixers': {}}
\}
```

Running the profiling with the new changes:

```
FUNCTIONS SORTED ON TOTAL TIME
count  total (s)   self (s)  function
    1   0.155586   0.000090  <SNR>48_SyncAutocmd()
    1   0.155496   0.000044  coc#rpc#request()
    1   0.155426   0.141882  <SNR>51_request()
    3   0.060015   0.000793  gitgutter#process_buffer()
    1   0.056686   0.002627  gitgutter#diff#run_diff()
    1   0.052779             <SNR>120_write_buffer()
    7   0.022085   0.000215  airline#extensions#wordcount#get()
    1   0.021870   0.000030  <SNR>103_update_wordcount()
    1   0.021840             <SNR>103_get_wordcount()
    7   0.017337   0.000445  airline#extensions#branch#get_head()
    7   0.016550   0.000555  airline#extensions#branch#head()
    5   0.013796   0.001229  coc#api#call()
    1   0.012474             61()
    1   0.011914   0.000067  <SNR>118_on_exit_vim()
    1   0.011847   0.000105  gitgutter#diff#handler()
    7   0.011586   0.000568  <SNR>97_update_branch()
    7   0.010360   0.000311  <SNR>97_update_git_branch()
    7   0.009891   0.000175  FugitiveHead()
    7   0.009731   0.001515  airline#check_mode()
    1   0.009638   0.000241  gitgutter#sign#update_signs()
```

After turning off linting and fixing for this file my save time is reduced from `1.2 seconds` to `0.15 seconds`!

Most of the remaining time is spent on my autocompletion language server [coc.nvim](https://github.com/neoclide/coc.nvim). I have a hotkey to disable that. Let's profile one more time with the language server disabled:

```
FUNCTIONS SORTED ON TOTAL TIME
count  total (s)   self (s)  function
    3   0.062305   0.001030  gitgutter#process_buffer()
    1   0.058044   0.002699  gitgutter#diff#run_diff()
    1   0.054099             <SNR>120_write_buffer()
    7   0.021743   0.000225  airline#extensions#wordcount#get()
    1   0.021518   0.000034  <SNR>103_update_wordcount()
    1   0.021484             <SNR>103_get_wordcount()
    7   0.014579   0.000372  airline#extensions#branch#get_head()
    7   0.013873   0.000428  airline#extensions#branch#head()
    1   0.012950   0.000086  <SNR>118_on_exit_vim()
    1   0.012864   0.000113  gitgutter#diff#handler()
    1   0.010620   0.000249  gitgutter#sign#update_signs()
    7   0.009562   0.000509  <SNR>97_update_branch()
    7   0.009377   0.001295  airline#check_mode()
    7   0.008459   0.000311  <SNR>97_update_git_branch()
    7   0.008001   0.000157  FugitiveHead()
    1   0.007676   0.001424  airline#highlighter#highlight()
    7   0.007643   0.000757  fugitive#Head()
   14   0.006886   0.004566  fugitive#Find()
   33   0.005446   0.001403  airline#highlighter#exec()
    1   0.004727   0.004176  <SNR>125_upsert_new_gitgutter_signs()
```

A few simple changes reduced my save time from `1.2 seconds (!!)` to `0.06 seconds`!
