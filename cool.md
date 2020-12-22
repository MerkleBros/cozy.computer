## Journal highlights
Meaningful highlights from my daily journal.

{% for entry in site.journal_entries %}
  {{entry.date}}
  {{entry.content}}
{% endfor %}
