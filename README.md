# AWARE-VLA supplementary material

Static site: https://aware-vla.github.io/

## Content

- `index.html`: paper title, demo gallery, dataset overview.
- `data/demos.json`: video titles, categories, dimensions, and media paths.
- `data/examples.json`: representative UMI observations and task labels.
- `data/dataset_stats.json`: chart values and counting definitions.
- `media/`: web-ready videos, posters, observations, and charts.

Videos retain their full frame and the supplied 3x playback timing. They load
on demand, and starting another video pauses the previous one. Source audio
and identifying media metadata are excluded from the web copies.

GitHub Pages publishes the root of `main`. All runtime assets are self-hosted;
there is no analytics, external font, or third-party media dependency.

Before publishing updates, check video playback, category filters, mobile
layout, chart totals, anonymous commit identity, and asset filenames.
