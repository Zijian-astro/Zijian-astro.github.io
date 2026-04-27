# ADS publication updates

Publications are rendered by al-folio from `_bibliography/papers.bib`.

The workflow `.github/workflows/update-publications.yml` refreshes that file on the first day of every month from this NASA ADS public library:

https://ui.adsabs.harvard.edu/public-libraries/VS5BWzVyQMOzCiWsCB0gAw

## Required GitHub secret

Add a repository secret named `ADS_API_TOKEN`:

1. Open GitHub repository settings.
2. Go to `Secrets and variables` -> `Actions`.
3. Add `ADS_API_TOKEN` with your ADS API token.

The workflow can also be run manually from the GitHub Actions tab.

## Selected papers

The update script preserves existing `selected = {true}` flags when ADS refreshes the BibTeX file. To mark another paper as selected, add `selected = {true}` to its BibTeX entry once; future monthly updates will keep that flag as long as the BibTeX key remains the ADS bibcode.
