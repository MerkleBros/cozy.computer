---
layout: post
Title: "Curling Byte Magazine covers and converting PDF pages to PNG"
Date: 2020-02-19
draft: true
---
I've recently become inspired by [Byte Magazine's](https://en.wikipedia.org/wiki/Byte_(magazine)) beautiful cover art illustrations.

![curling-byte-magazine-covers-1.png](assets/curling-byte-magazine-covers-1.png)

The cover pieces, largely by artist [Robert Tinney](https://en.wikipedia.org/wiki/Robert_Tinney), are full of wonderful visual metaphors for abstract computing concepts. [In an email interview](http://www.vintagecomputing.com/index.php/archives/169/vcg-interview-robert-tinney-microcomputer-illustration-pioneer) Tinney explained that his non-technical background helped him to see technical concepts in unique ways.

I wanted my own copies of these covers and [found a collection of the covers grouped by year as PDFs](http://www.vintagefreeware.com/bytecvrs.htm). The `pdf` files [had twelve pages each](http://www.vintagefreeware.com/1978.pdf) - for the twelve monthly issues in a year - but I wanted each month's cover as a separate `.png`.

## Converting Image Formats on Linux
I can see from [Fuzzy finding](https://github.com/junegunn/fzf/wiki/examples#man-pages) the manual pages that there are many tools for operating on PDF files:

![curling-byte-magazine-covers-0.png](assets/curling-byte-magazine-covers-0.png)

`Imagemagick` is a popular tool for doing image processing that provides `convert` for converting pdf to various image formats. But [some people reported](https://askubuntu.com/questions/50170/how-to-convert-pdf-to-image) having image quality issues converting `pdf` to `png` using `convert`.

`Cairo` is another popular tool that provides `pdftocairo` for converting a pdf viewable in Gnome's `Popler` pdf viewer to various image formats. I've used `Cairo` before so wanted to try something else.

## pdftoppm
There's a set of tools that comes with Ubuntu that all begin with `pdf*` and according to the manual are mysteriously developed by `Glyph & Cog, LLC (copyright 1996-2011)`.
- `pdfinfo` extracts metadata from pdf files (title, subject, keywods, author, creation date, etc)
- `pdftotext` extracts text from a pdf
- `pdftohtml` extracts a pdf to an html document
- `pdftoppm` extracts a pdf to `color images files in Portable Pixmap (PPM) format, grayscale image files in Portable Graymap (PGM) format, or monochrome image files in Portable Bitmap (PBM) format.`

I'd never heard of these strange file formats. `PPM`, `PGM`, and `PBM` all belong to family of image files defined in the [Netpbm](https://en.wikipedia.org/wiki/Netpbm) library. They are designed to be "easily exchanged between platforms" and originally invented to send bitmaps through email messages.

Although the `pdftoppm` descriptions doesn't include `.png` or `.jpeg`, it has flags for both. And it saves each page of a `pdf` as a `.png`!

## Retrieving and processing the PDF files
The PDF files are conveniently located in the incrementable format

`http://www.vintagefreeware.com/YEAR_NUMBER.pdf`

where the `YEAR_NUMBER`s I care about are `1977-1987`.

These were the years when Robert Tinney illustrated the magazine covers - before Byte Magazine pivoted to boring product photos that they thought better catered to the younger IT crowd that saw Byte Magazine as an ancient magazine for aging techies.

Bash provides a `sequence expression` for generating ranges. `{START_NUMBER..END_NUMBER}` will expand to all numbers in that range inclusively. This is called a `brace expansion` because the range is inside `braces`. To enable `brace expansion`, use `set -B` at the top of the file.

I'll use a `for` loop with a `sequence expression` to loop over the URL's, `curl` each URL and save the `pdf`, then use `pdftoppm` to convert each `pdf` to `png` and save them in a directory named after the year that they were drawn:

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

In addition to `brace expansion`, this code also uses `parameter expansion` with the `$` symbol, where all `$i` are replaced with the value of `i`.

The `bash` manual helpfully points out that you can optionally wrap parameters in braces as `{$i}` which would protect them from the characters immediately following them. For instance, if I had a variable named `i.`, it's possible that the interpreter would think I meant `$i.` in `curl -O "http://www.vintagefreeware.com/$i.pdf"` instead of `$i`.
