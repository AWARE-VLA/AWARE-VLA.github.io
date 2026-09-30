# AWARE-VLA supplementary material

Static site: https://aware-vla.github.io/

## Content

- `index.html`: paper title, demo gallery, dataset overview.
- `data/demos.json`: source filenames, normalized titles, dimensions, and media paths.
- `data/examples.json`: representative UMI observations and task labels.
- `data/dataset_stats.json`: chart values and counting definitions.
- `media/`: web-ready videos, posters, observations, and charts.

Videos retain their full frame and the supplied 3x playback timing. They load
on demand in a shared large player. Landscape and portrait thumbnails occupy
separate aligned grids, and all clips remain visible without category filters.
Source audio
and identifying media metadata are excluded from the web copies.

GitHub Pages publishes the root of `main`. All runtime assets are self-hosted;
there is no analytics, external font, or third-party media dependency.

Before publishing updates, check video playback, player navigation, mobile
layout, chart totals, anonymous commit identity, and asset filenames.
