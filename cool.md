## Journal highlights
{: class="journal-highlights"}
Meaningful highlights from my daily journal.

{% for entry in site.journal_entries reversed %}
  {{entry.date | date: "%b %d, %Y"}}
  {: class="journal-entry-header"}
  {{entry.content}}
{% endfor %}
