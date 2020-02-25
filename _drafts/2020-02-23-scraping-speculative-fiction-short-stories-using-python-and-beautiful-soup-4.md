---
layout: post
Title: "Scraping speculative fiction short stories using Python and Beautiful Soup 4"
Date: 2020-02-18
---
## Speculative fiction deep dive
[Speculative fiction](https://en.wikipedia.org/wiki/Speculative_fiction) is an umbrella genre of fiction covering science fiction, fantasy, horror, dystopian, [weird](https://en.wikipedia.org/wiki/Weird_fiction), and other types of fiction.

Last year I began devouring speculative fiction short stories with the eventual goal of writing and publishing short stories in this genre. Since August 2019, I've read and analyzed over 650,000 words of speculative fiction spread over 130 short stories, many of them award winning stories represented in the [Hugo Awards](https://en.wikipedia.org/wiki/Hugo_Award_for_Best_Short_Story), [Nebula Awards](https://en.wikipedia.org/wiki/Nebula_Award_for_Best_Short_Story), [British Fantasy Awards](https://en.wikipedia.org/wiki/British_Fantasy_Award), and [World Fantasy Awards](https://en.wikipedia.org/wiki/World_Fantasy_Award%E2%80%94Short_Fiction).

## Toward a science fiction database
I wanted to build a database of speculative fiction stories - including story texts - for my own personal use. This corpus would eventually help to answer questions like:
- What is the grade school reading comprehension level for an author's work? For speculative fiction in general? How does it compare to other types of fiction? How has this changed over time?
- What is an author's favorite unique or weird word?
- Average sentence length in words for a story, for a passage or paragraph, for an author, etc.
- How many adjectives are in a given story or an author's collection of work?
- What is an author's or story's overall emotional sentiment?
- What is the average length for speculative fiction stories?
- Do speculative fiction stories in one genre tend to use more tropes and words from that genre? Are there overlapping words or phrases specific to speculative fiction stories?

[Archived pulp magazines](https://archive.org/details/pulpmagazinearchive) are [great sources](https://www.kaggle.com/jannesklaas/scifi-stories-text-corpus) for older speculative fiction stories. However, I am interested in the modern state of speculative fiction.

The modern body of award winning speculative fiction can largely be found within a [relatively small set of physical and online speculative fiction magazines](https://schwitzsplinters.blogspot.com/2019/08/top-science-fiction-and-fantasy.html) and anthologies.

These magazines include:
- [Asimov's Science Fiction](https://www.asimovs.com/)
- [Clarkesworld](http://clarkesworldmagazine.com/)
- [Tor.com](https://www.tor.com/category/all-fiction/)
- [The Magazine of Fantasy and Science Fiction](https://www.sfsite.com/fsf/index.html)
- [Lightspeed Magazine](http://www.lightspeedmagazine.com/)
- [Subterranean Press](https://subterraneanpress.com/)
- [Analog: Science Fiction and Fact](https://www.analogsf.com/)
- [Uncanny](https://uncannymagazine.com/)
- [Strange Horizons](http://strangehorizons.com/)
- [Beneath Ceaseless Skies](http://www.beneath-ceaseless-skies.com/)
- [Interzone](http://ttapress.com/interzone/about/)
- [Apex Magazine](https://www.apex-magazine.com/issue-120-may-2019/)
- [Nightmare Magazine](http://www.nightmare-magazine.com/)

Many of these magazines are freely available on the internet. To start building this corpus I decided to scrape one of my favorites: [Lightspeed Magazine](http://www.lightspeedmagazine.com/).

## Web scraping using Python and Beautiful Soup 4
[Beautiful Soup 4](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) is a Python package for pulling data from HTML and XML files. It uses a `parser` - a program that takes a source document (typically text) and builds a data structure (typically a tree) from the source. These data structures are typically called `parse trees` or `abstract syntax trees`. `Beautiful Soup 4 (BS4)` provides a set of methods for using a parser of your choice to extract information from web pages.

An example workflow for using `Beautiful Soup 4 (BS4)` is:
- Request the source pages using an HTTP library like Python's [Requests](https://requests.readthedocs.io/en/master/) library.
