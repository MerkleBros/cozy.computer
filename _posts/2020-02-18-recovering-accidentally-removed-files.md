---
layout: post
Title: "Recovering accidentally removed files"
Date: 2020-02-18
---
##### Notes on recovering accidentally removed files on Ubuntu 18.04
Have you ever run `rm` and immediately come to regret your decision? Me too!

Recently I was trying to remove a group of directories full of downloaded images using `rm -r *` only to realize that it also removed a Bash script I'd used to download those images! Although it was only thirteen lines of Bash, I was curious if I could recover all or part of this file.

If you've removed a file via the Graphic User Interface, it's possible they've been moved to the `Trash`. Like the Windows `Recycle Bin`, Ubuntu keeps files deleted via the [Nautilus file manager](https://en.wikipedia.org/wiki/GNOME_Files) here:

```
/home/username/.local/share/Trash
```

Unfortunately, if you `rm` a file, it does not go to the `Trash`.

[A helpful Stackoverflow post](https://superuser.com/questions/150027/how-to-recover-a-removed-file-under-linux) suggests that you can search for removed text-containing files using `grep`:

```
sudo grep -i -a -B10 -A100 'your-file-name' your-partition > file.txt
```

where `-i` ignores case, `-a` is for processing binary files as if they were text, `-B10` and `-A100` show ten lines of context before and 100 lines of context after a match is found.

I remembered my file name `curl-byte-magazine-covers.sh` but didn't know what partition I was on. I assumed it was wherever my root filesystem was installed. Running `df` and finding `/` in the `Mounted on` column showed my partition as `/dev/sda5`.

Putting the command together:

```
sudo grep -i -a -B10 -A100 'curl-byte-magazine-covers' /dev/sda5 > file.txt
```

Success! Opening `file.txt` showed ... 70,000 lines of mostly nonsense.

I searched the file for `echo`, a command I knew was in my file, and was able to locate the body of the file. Strangely, the `set` commands I'd placed at the top of the file were missing.

![recovering-accidentally-removed-files-0.png](assets/recovering-accidentally-removed-files-0.png)

Searching for `pipefail`, I was able to locate the two missing `set` commands.

![recovering-accidentally-removed-files-1.png](assets/recovering-accidentally-removed-files-1.png)

Piecing it all back together, and adding in the `#! /usr/bin/env bash` which had also disappeared:

```
#! /usr/bin/env bash

set -Ceuo pipefail
set -B # enable brace expansion

for i in {1977..1987}; do
  echo "Downloading pdf for issue $i"
  curl -O "http://www.vintagefreeware.com/$i.pdf"

  mkdir -v "$i"
  echo "Creating .png files for issue $i"
  pdftoppm "$i.pdf" "$i/Byte-Magazine-$i" -png
done
```
