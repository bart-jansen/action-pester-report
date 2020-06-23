# Pester Report

This action generates a Github Actions Check report with annotations for NUnit-formatted Pester tests.

## Inputs

### `github_token`

**Required** - Github token to generate Pester report, usually: `${{ secrets.GITHUB_TOKEN }}`.


### `path`

Optional - Glob path of the pester tests . Default `**/test-reports/TEST-*.xml`.

### `name`

Optional - Name of the generated report. Default `Test Report`.


## Example usage
```yml
uses: bart-jansen/action-pester-report@v1
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  path: '**/test-reports/TEST-*.xml'
```