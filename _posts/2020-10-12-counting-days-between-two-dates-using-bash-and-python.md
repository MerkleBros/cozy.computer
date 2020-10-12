---
layout: post
title:  "Counting days between two dates using Bash and Python"
date:   2020-10-12
draft: true
---
[Github code](https://github.com/MerkleBros/datediff)

TLDR: A Bash wrapper around Python's `date` module for counting days between two dates.

```
./datediff.sh "2020, 12, 21" "2020, 10, 12"
# 70 days, 0:00:00
```

## Background

I often want to know the number of days between two dates. Lately as the days get shorter, I want to know how many days until the `Hiemal (Winter) Solstice`, after which the length of days will begin increasing again.

It turns out you can just Google something like ["how many days between 10/12/2020 and 12/21/2020".](https://www.google.com/search?sxsrf=ALeKk02lIcycCDnJEE1Vbpuvlgf3P_Muuw%3A1602521350419&ei=BomEX9yRGeaHggfZnqHwDA&q=how+many+days+between+10%2F12%2F2020+and+12%2F21%2F2020&oq=how+many+days+between+10%2F12%2F2020+and+12%2F21%2F2020&gs_lcp=CgZwc3ktYWIQAzoECAAQR1CqIFiVJWD1J2gAcAJ4AIABuAGIAe0CkgEDMC4ymAEAoAEBqgEHZ3dzLXdpesgBCMABAQ&sclient=psy-ab&ved=0ahUKEwjcrNiewa_sAhXmg-AKHVlPCM4Q4dUDCAw&uact=5)

But we can find this programmatically using the `date` module from `Python` and then wrap it in a simple `Bash` script.

## Code

`datediff.sh` is a `Bash` script for counting the number of days between two dates:

```
#! /usr/bin/env bash
set -Ceuo pipefail

readonly DATE_ONE="$1"
readonly DATE_TWO="$2"

python -c "from datetime import date as d; print(d($DATE_ONE) - d($DATE_TWO))"
```

The `python -c` specifies a `Python` command to execute. We import the `date` library, use it to process our two input strings (`$1`, `$2`) into date objects, and then subtract them and print the result.

## Usage
Provide two dates as `"YYYY, MM, DD"` where:
- `YYYY` is the four digit year
- `MM` the two digit month
- `DD` is the two digit day

Date subtraction will return a positive number if the first date is later than the second date, or a negative number if the first date is smaller than the second date.

```
./datediff.sh "2020, 12, 21" "2020, 10, 12"
# 70 days, 0:00:00

./datediff.sh "2020, 10, 12" "2020, 12, 21"
# -70 days, 0:00:00
```

The script tells me that there are 70 days to go until the Winter Solstice!
