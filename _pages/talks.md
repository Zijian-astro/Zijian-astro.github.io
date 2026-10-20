---
layout: page
permalink: /talks/
title: talks
description: Conference talks, posters and tutorials.
nav: true
nav_order: 3
---

{% comment %} Edit the lists in _data/talks.yml. {% endcomment %}

<h2 class="talk-heading">Scientific presentations</h2>
{% include talk-list.liquid talks=site.data.talks.scientific %}

<h2 class="talk-heading">Other talks and tutorials</h2>
{% include talk-list.liquid talks=site.data.talks.other %}
