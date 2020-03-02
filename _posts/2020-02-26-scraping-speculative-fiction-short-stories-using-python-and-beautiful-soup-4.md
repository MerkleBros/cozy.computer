---
layout: post
Title: "Scraping speculative fiction short stories using Python and Beautiful Soup 4"
Date: 2020-02-26
---
## Speculative fiction deep dive
[Speculative fiction](https://en.wikipedia.org/wiki/Speculative_fiction) is an umbrella genre of fiction covering science fiction, fantasy, horror, dystopian, [weird](https://en.wikipedia.org/wiki/Weird_fiction), and other types of fiction.

Last year I began devouring speculative fiction short stories with the eventual goal of writing and publishing short stories in this genre. Since August 2019, I've read and analyzed over 650,000 words of speculative fiction spread over 130 short stories, many of them award winning stories represented in the [Hugo Awards](https://en.wikipedia.org/wiki/Hugo_Award_for_Best_Short_Story), [Nebula Awards](https://en.wikipedia.org/wiki/Nebula_Award_for_Best_Short_Story), [British Fantasy Awards](https://en.wikipedia.org/wiki/British_Fantasy_Award), [Bram Stoker Award](https://en.wikipedia.org/wiki/Bram_Stoker_Award_for_Short_Fiction), and [World Fantasy Awards](https://en.wikipedia.org/wiki/World_Fantasy_Award%E2%80%94Short_Fiction).

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

Many of these magazines are freely available on the internet. But copying and pasting them manually takes a long time and is error prone.

## Web scraping using Python and Beautiful Soup 4
`Web scraping` - programmatically gathering content from websites - is one way to build a large corpus from various sources on the internet.

To start building this corpus I decided to scrape one of my favorite speculative fiction magazines: [Lightspeed Magazine](http://www.lightspeedmagazine.com/).

### Beautiful Soup 4
[Beautiful Soup 4](https://www.crummy.com/software/BeautifulSoup/bs4/doc/) is a Python package for pulling data from HTML and XML files.

It uses a `parser` - a program that takes a source document (typically text) and builds a data structure (typically a tree) from the source. These data structures are typically called `parse trees` or `abstract syntax trees`.

`Beautiful Soup` provides a set of methods for using a parser of your choice to extract information from web pages.

A typical workflow for using `Beautiful Soup` is:
- GET the source pages as HTML using an HTTP library
- Construct a parse tree object using `Beautiful Soup` and your parser of choice to parse the requested HTML
- Use `Beautiful Soup` to find content in the parse tree object
- Save the content for later (we'll use a [Python pickle file](https://docs.python.org/3/library/pickle.html))

### Project setup
Make a new directory and track it with git:

```
mkdir science-fiction-magazines-nlp && cd science-fiction-magazines-nlp
mkdir old-pickles
git init
touch app.py
touch requirements.in
```

Inside `.gitignore`, ignore our virtual environment files and pickle files (we don't want to upload copyrighted material to the internet):

```
venv
*.p
old-pickles
```

### Virtual environment setup with pip-tools
Set up a `virtual environment` for managing dependencies: `python3 -m venv venv` (`-m` for module name, meaning Python will search for and run a module named `venv`).

I like to use `pip-tools` ([github link](https://github.com/jazzband/pip-tools)) for managing dependencies.

It lets you define `top-level or explicit` dependencies - ones you actually want to use in your project - separately from `implicit dependencies` - dependencies installed because other dependencies need them. It also automatically `pins` dependencies to specific versions which makes it easier for other developers to rebuild your project in the future. [It's a good idea to pin dependencies](https://nvie.com/posts/pin-your-packages/).

Install `pip-tools` with `pip3 install pip-tools`.

Put our top-level dependencies in `requirements.in` (`.in` is a generic file extension meaning `input`):

```
pylint
requests
beautifulsoup4
```

I like [pylint](TODO: link to pylint) because it will gently remind me when my code is not following common programming patterns and it will format my code in a standard way. Pylint is technically a `developer requirement` and the normal pattern is to save those in `dev-requirements.in` but I didn't do that here.

Running `pip-compile` will place requirements into a `requirements.txt` with all dependencies `pinned`. This file has all of your dependencies `pinned` to a specific version and tells which dependencies required the other dependencies. My `requirements.txt`:

```
#
# This file is autogenerated by pip-compile
# To update, run:
#
#    pip-compile
#
astroid==2.3.3            # via pylint
beautifulsoup4==4.8.2
certifi==2019.11.28       # via requests
chardet==3.0.4            # via requests
idna==2.8                 # via requests
isort==4.3.21             # via pylint
lazy-object-proxy==1.4.3  # via astroid
mccabe==0.6.1             # via pylint
pylint==2.4.4
requests==2.22.0
six==1.14.0               # via astroid
soupsieve==1.9.5          # via beautifulsoup4
typed-ast==1.4.1          # via astroid
urllib3==1.25.7           # via requests
wrapt==1.11.2             # via astroid
```

Activate the virtual environment: `. venv/bin/activate` (also, maybe look at `venv/bin/activate` because it's only 70 lines of code and just sets a few environment variables).

All Python code for this project will go in `app.py`. Let's import dependencies there:

```
"""Functions for requesting and processing html from Science Fiction magazines"""
import os
import re
import time
import pickle
import traceback
import requests
from bs4 import BeautifulSoup
```

### Requesting pages
We can use the [requests library](https://requests.readthedocs.io/en/master/) to `GET` pages and parse them with `Beautiful Soup` using the built-in HTML parser `html.parser`.

`Beautiful Soup` will use the parser to generate a `soup` object. This object has the `parse tree` created by the parser and some helper methods for operating on that `parse tree`.

In `app.py` create a function for requesting a page and returning the `soup` object representing that page:

```python
def request_soup_page(url: str):
    """Request an html page and return a BeautifulSoup object for that page"""
    print(f"Requesting page {url}")

    request = requests.get(url)
    status = request.status_code

    print(f"Received page {url} with status {status}")
    if status == 404:
        return {}

    soup = BeautifulSoup(request.content, 'html.parser')
    return soup
```

Here `requests.get(url)` performs an HTTP `GET` request for the HTML at the given `url`. If the page was found, use `Beautiful Soup` to parse the page into an object (`soup`) and return that object.

## Collecting links to all issues of the magazine
The magazine [lists all issues](http://www.lightspeedmagazine.com/category/issues/) as a `paginated list` - a list separated over several pages. We will need to `GET` all pages of this list and then use `Beautiful Soup` to find the link to each issue on each page.

We can construct URLs for the paginated list pages: `http://www.lightspeedmagazine.com/category/issues/page/NUMBER`.

The `base_url` is `http://www.lightspeedmagazine.com/category/issues/page/`.

We will just increment `NUMBER` until the page isn't found (when `request_soup_page` returns an empty object instead of a soup object). We will collect the `soup` objects representing each page of the paginated list in a list(`pages`) and return this list:

```python
def request_all_paginated_list_pages(base_url: str) -> list:
    """Return html for each page of a paginated list as list of BeautifulSoup objects"""
    print(f"Requesting paginated list pages from {base_url}")

    status = 200
    list_page = 0
    pages = []

    while status != 404:
        list_page += 1
        list_page_url = f"{base_url}/{list_page}"

        print(f"Request list page {list_page}")

        soup = request_soup_page(list_page_url)

        if soup == {}:
          status = 404

        print(f"Received list page {list_page} with status {status}")

        if status == 404:
            break

        pages.append(soup)

        time.sleep(5)
    return pages
```

Note that `time.sleep(5)` waits for five seconds between requests. It's important to be mindful of server loads when scraping - we don't want to DDOS our favorite magazines.

Now we have a list of `soup` objects representing the paginated list of issues with links to every issue.

### Using Beautiful Soup 4 to find links to every issue of the magazine

`Beautiful Soup` uses a set of querying methods that return a `soup` object. This means you can chain queries together to find HTML elements deep in the `parse tree`.

In `find_all_issue_links`, we will iterate through each of the soup objects we collected using `request_all_paginated_list_pages()`. We'll use several methods on the `soup` object that all return another `soup` object:

- `body` to find the HTML body
- `find` to find a specific HTML element
- `find_all` to find all elements matching some condition

These methods let us find links (an `a` HTML element) for every issue of the magazine. Then we can access the `href` property for every link to get a URL string. We return a list of these URLs.

Finding out where to look for the URLs was a manual process of inspecting with the [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools).

```python
def find_all_issue_links(issues_pages: list):
    """Find all issue url strings in a list of issue html pages (BeautifulSoup objects)"""
    print(f"Finding all issue links")

    urls = []

    for index, page in enumerate(issues_pages):
        print(f"Finding issue links in page {index + 1}")

        post_wrapper_divs = page.body \
            .find("div", {"id": "wrapper"}) \
            .find("div", {"id": "main"}) \
            .find("div", {"id": "content"}) \
            .find("div", {"class": "content_box"}) \
            .find_all("div", {"class": "post_wrapper"})

        for div in post_wrapper_divs:
            url = div \
                .find("div", {"class": "post_content"}) \
                .find("h2", {"class": "posttitle"}) \
                .find("a")["href"]
            urls.append(url)

        print(f"Total issue links found so far: {len(urls)}")

    return urls
```

### Wrapping function for collecting all issue links
I use a wrapping function (`request_and_find_and_save_issue_links()`) for collecting the issue links to avoid polluting `main()`. It uses the functions from above and saves the list of URLs to a `pickle` - a way for Python to persist objects to disk - called `issue_links.p`.

```python
def request_and_find_and_save_issue_links(pickle_url: str):
    """Request, find, and save list of issue link url strings as a pickle"""
    print(f"Getting all issue list pages")

    base_url = "http://www.lightspeedmagazine.com/category/issues/page"
    pages = request_all_paginated_list_pages(base_url=base_url)
    issue_links = find_all_issue_links(issues_pages=pages)

    print(f"Dumping {len(issue_links)} links to pickle issue_links")

    with open(pickle_url, 'wb') as file_pointer:
        pickle.dump(issue_links, file_pointer)
```

### Loading from pickle files
Since we're saving pickle files, let's make a function for loading them:

```python
def load_from_pickle(url: str):
    """Return an object loaded from a local pickle file"""
    with open(url, 'rb') as file_pointer:
        return pickle.load(file_pointer)
```

## Collecting links to all stories in the magazine
Each [issue has its own page](http://www.lightspeedmagazine.com/issues/feb-2020-issue-117/) with links to every story in that issue. From inspecting the HTML, I can see that the fictional stories are always marked as `Science Fiction` or `Fantasy`. We need to collect every story link marked as `Science Fiction` or `Fantasy` from every issue.

Each issue is divided into `posts` where each `post` is in a separate `div` with class `post_wrapper`. Each post has an `h2` with the link to the story and an `h3` with category information. If the category is `Science Fiction` or `Fantasy` we save it to a list.

A function for using `Beautiful Soup` to find all of the story links on an issue's page:

```python
def find_all_story_links_from_issue(issue: object):
    """Return a list of all story url strings in an issue (BeautifulSoup object)"""
    print(f"Getting all story links from issue")

    post_wrapper_divs = issue.body \
        .find("div", {"id": "wrapper"}) \
        .find("div", {"id": "main"}) \
        .find("div", {"id": "content"}) \
        .find("div", {"class": "content_box"}) \
        .find_all("div", {"class": "post_wrapper"})

    print(f"Found {len(post_wrapper_divs)} post_wrapper divs")

    links = []
    for post in post_wrapper_divs:
        post_content = post.find("div", {"class": "post_content"})
        category_header = post_content.find("h3")
        title_header_link = post_content.find("h2", {"class": "posttitle"}).find("a")

        if not category_header or not title_header_link:
            continue

        link = title_header_link["href"]

        if (category_header.contents[0] == "Science Fiction" or \
            category_header.contents[0] == "Fantasy"):
            print(f"Added link {link}")
            links.append(link)

    print(f"Found {len(links)} story links from issue")
    return links
```
### Wrapping function for collecting all story links

We use another wrapper function to avoid polluting main. This function takes a list of issue links and the path to a pickle file of story links (if this file exists).

For each issue:
- if a list of story links already exists, load it from the pickle
- request the issue page for the current issue as HTML
- find a link to every story in that issue
- append these story links to the existing list of story links
- save the updated list of story links as a pickle

The pickle file helps preserve state between processing each issue, so that if an error is encountered we don't have to request every issue again.

```python
def request_and_find_and_save_story_links_from_issues(issue_links: list, pickle_url: str):
    """Request, find, and save a list of all story url strings in issues as a pickle"""
    print(f"Getting all story links from issues")

    story_links = []
    for issue_link in issue_links:

        if os.path.exists(pickle_url):
            story_links = load_from_pickle(pickle_url)
            print(f"Loaded pickle {pickle_url} with {len(story_links)} story links")

        issue_page = request_soup_page(url=issue_link)
        links = find_all_story_links_from_issue(issue=issue_page)
        story_links = story_links + links

        print(f"Found {len(story_links)} story links so far")
        print(f"Dumping {len(story_links)} links to pickle {pickle_url}")

        with open(pickle_url, 'wb') as file_pointer:
            pickle.dump(story_links, file_pointer)

        time.sleep(5)
```

Now we have links for every story in the magazine.

## Collecting stories from each story page
Each story [has its own page](http://www.lightspeedmagazine.com/fiction/story-kit/) with the following information that we can store in a `dictionary`:
- Author
- Title
- Issue (the issue containing this story)
- Issue URL (a link to the issue)
- Word count
- Type of story (as a sanity check, they should all be of type `Fiction`)
- Content (the body of the story)

The story content is spread over many HTML elements that need to be processed differently. We will build a string for the story starting with an empty string:
- `p` elements are converted to text and added to the string
- `ol` and `ul` are converted to text and added to the string
- `img` are ignored
- `div` with class `divider` are added as text as `. . .\n\n`

Again we can inspect each story's page, find the information we care about, and use `Beautiful Soup` to extract it and return a dictionary representing that story:

```python
def find_story_from_story_page(story_page: object):
    """Return a dictionary representing a story from a story html page"""
    print(f"Finding story from story page")

    story = {}

    content_box = story_page.body \
        .find("div", {"id": "wrapper"}) \
        .find("div", {"id": "main"}) \
        .find("div", {"id": "content"}) \
        .find("div", {"class": "content_box"}) \

    story_type = content_box.find("h3").contents[0]

    author = content_box \
        .find("div", {"class": "about_author"}) \
        .find("h2") \
        .find("span") \
        .contents[0]

    post_div = content_box \
        .find("div", {"id": re.compile("^post-")})

    title = post_div \
        .find("h1", {"class": "posttitle"}) \
        .contents[0]

    issue_paragraph = post_div \
        .find("p", {"class": re.compile("postmetadata date")})

    issue = issue_paragraph.find("a").contents[0]
    issue_url = issue_paragraph.find("a")["href"]
    word_count = re.search(r'\b\d+\b', issue_paragraph.contents[2]).group(0)

    story_div = post_div \
        .find("div", {"class": "entry"})

    story_div_elements = list(story_div.children)

    content = ""
    for element in story_div_elements:
        # ignore paragraphs containing images or links
        if element.find("img") or element.find("a"):
            continue
        if element.name in ["p"]:
            content += f"{element.get_text()}\n\n"
        if element.name in ["ol", "ul"]:
            text = element.get_text('\n')
            content += f"{text}"
        if element.name == "div" and element["class"] == "divider":
            content += f". . . .\n\n"

    story.update(
        { "author": str(author)
        , "title" : str(title)
        , "issue": str(issue)
        , "issue_url": str(issue_url)
        , "word_count": str(word_count)
        , "type": str(story_type)
        , "content": content
        })

    return story
```

### A wrapping function for saving stories
Now we have a list of story URLs and a function for extracting the stories from a story's HTML.

We'll save each story `dictionary` in another `dictionary` called `stories`. Between processing each story, we'll save the current `stories` to a pickle that we provide as `pickle_url`.

Assuming stories don't change, we'll only retrieve information for stories that haven't been processed before.

For every story link:
- Check if a pickle file containing stories already exists
- - If so, load it and get the URL for every story that has already been processed
- - If the current story link has already been processed, ignore it and continue to the next story link
- Use `request_soup_page()` to get a `soup` object for the story's HTML
- Use `find_story_from_story_page()` to get a `dictionary` representing the story
- - If the story dictionary is malformed, save that story's URL to a pickle `failed_story_urls.p` for processing later and continue to the next story link
- Add the story dictionary to the `stories` dictionary
- Save the `stories` dictionary to a pickle and continue to the next story link

```python
def request_and_find_and_save_stories_from_story_links(story_links: list, pickle_url: str):

    """
    Request, find, and save all stories and story metadata as a pickle

    Builds a dictionary of stories and saves it as a pickle.

    stories dictionary structure:
    keys: "story title-Author Name"
    example key: "The Traditional-Maria Dahvana Headley"
    values: a story dictionary containing story content and metadata
      { "author": "author name"
      , "title": "story title"
      , "story_url": "magazine.com/story1234"
      , "issue": "story issue name"
      , "issue_url": "magazine.com/issue1234"
      , "word_count": "1234"
      , "type": "Fiction"
      , "content": "body of story"
      }
    """

    print(f"Getting all stories from story links")

    stories = {}
    failed_story_urls = []
    for story_link in story_links:
        try:
            if os.path.exists(pickle_url):
                stories = load_from_pickle(pickle_url)
                print(f"Loaded pickle {pickle_url} with {len(stories)} stories")
                story_urls = [story["story_url"] for story in list(stories.values())]
                if story_link in story_urls:
                    print(f"Found story in pickle, skipping story {story_link}")
                    continue

            story_page = request_soup_page(url=story_link)
            story = find_story_from_story_page(story_page=story_page)
            story["story_url"] = story_link

            if not all(keys in story for keys in \
                        ("author", "title", "issue", "issue_url", "word_count", "content")):
                print(f"Problem getting story data from story url {story_link}")
                raise Exception("Malformed story data")

            stories[f'{story["title"]}-{story["author"]}'] = story

            print(f"Found {len(stories)} stories so far")
            print(f"Dumping {len(stories)} stories to pickle {pickle_url}")

            with open(pickle_url, 'wb') as file_pointer:
                pickle.dump(stories, file_pointer)

            time.sleep(5)

        except Exception as err:
            print(f"Failed to retrieve and process story {story_link}, adding to failed_story_urls.p")
            print(traceback.format_exc())
            failed_story_urls.append(story_link)

            with open('failed_story_urls.p', 'wb') as file_pointer:
                pickle.dump(failed_story_urls, file_pointer)
```

Now all stories from the magazine are saved in a local `pickle` file.

## Running from the command line using main()

If `app.py` is run using `python3 app.py` we want the `main()` function to be executed. Running a `.py` file with `python3` sets the `__name__` attribute to `__main__` by default. So check if `__name__` is `__main__`:

```
if __name__ == '__main__':
    main()
```

The `main()` function will get and save issue links as a pickle, get and save story links as a pickle, and get and save stories as a pickle:

```python
def main():
    """
    Run functions to retrieve and process html from Lightspeed magazine

    Only need to run each once to save data to pickle files.

    Three pickle files are saved (with the suggested names):
    issue_links.p is a list of url strings for all magazine issues
    story_links.p is a list of url strings for all stories in the magazine
    stories.p is an object containing story content and metadata for all stories
    """

    request_and_find_and_save_issue_links(pickle_url="issue_links.p")

    issue_links = load_from_pickle("issue_links.p")

    request_and_find_and_save_story_links_from_issues( \
        issue_links=issue_links, pickle_url="story_links.p")

    story_links = load_from_pickle(url="story_links.p")

    request_and_find_and_save_stories_from_story_links( \
        story_links=story_links, pickle_url="stories.p")

if __name__ == '__main__':
    main()
```

That's it! Run `python3 app.py` and after some time we'll have `869` of the magazine's stories available as a pickle file `stories.p`.

A few stories have a different HTML structure and throw errors when processed - we'll have to manually account for those in our code later.

To update the data in the future, remove `issue_links.p` and `story_links.p` (or move them to old_pickles directory) and run the script again. You don't need to remove `stories.p` since the Python script only saves new stories.

This process can be extended to other speculative fiction magazines that have content available online for free. In the future we'll use these stories to answer some interesting questions about speculative fiction.
