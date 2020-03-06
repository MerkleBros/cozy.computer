```
Cozy computer is CC to me
Spindled in comfort and beeping softly
Cozy computer with cuppa coffee
Or mocha, or Hi-C, or even Capri
```
```
Cozy computer (CC) whispers squeaky
Look upon my works ye mighty, and drink tea
```

## Blog
{% for post in site.posts %}
  {% assign read_time =
    post.content |
    number_of_words |
    divided_by: site.average_reading_speed_words_per_minute |
    plus: 1 |
    round
  %}
  {:.post-word-count}
  [{{post.title}}]({{post.url}}) ({{read_time}} minutes)
{% endfor %}
