# Pester Report

This action processes a  generates a Github Actions report annotations from a given Pester output.

## Inputs

### `github_token`

**Required** Github token to generate Pester report, usually: `${{ secrets.GITHUB_TOKEN }}`.


### `path`

Optional Glob path of the pester tests . Default `**/test-reports/TEST-*.xml`.

### `name`

Optional Name of the generated report. Default `Test Report`.


## Example usage
```yml
uses: bart-jansen/action-pester-report@v1
with:
  path: '**/test-reports/TEST-*.xml'
```