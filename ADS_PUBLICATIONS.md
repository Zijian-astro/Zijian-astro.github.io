# ADS publication updates

Publications are rendered by al-folio from `_bibliography/papers.bib`.

The workflow `.github/workflows/update-publications.yml` refreshes that file on the first day of every month from this NASA ADS public library:

https://ui.adsabs.harvard.edu/public-libraries/VS5BWzVyQMOzCiWsCB0gAw

## Required GitHub secret

Add a repository secret named `ADS_API_TOKEN`:

1. Open GitHub repository settings.
2. Go to `Secrets and variables` -> `Actions`.
3. Add `ADS_API_TOKEN` with your ADS API token.

The workflow can also be run manually from the GitHub Actions tab. The script calls the ADS HTTP API directly, so it does not need the third-party `ads` Python package.

## Homepage updates

The publications page always uses the full ADS BibTeX list.

The homepage has two extra rules:

- `selected publications` only shows BibTeX entries with `selected = {true}`. The update script preserves existing selected flags and automatically marks the five newest first-author papers as selected.
- `news` comes from `_news/`. The update script generates three `ads-publication-*.md` news items from the newest ADS publications.
- Citation badges are populated from the ADS `citation_count` field and displayed on both the publications page and selected publications on the homepage.

You can tune these defaults in `.github/workflows/update-publications.yml` by passing options to `bin/update_ads_publications.py`, for example:

```bash
python bin/update_ads_publications.py --auto-selected 8 --news-limit 5
```
