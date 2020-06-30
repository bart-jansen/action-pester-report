# GitHub Action: Generate Pester test reports

![](https://github.com/bart-jansen/action-pester-report/workflows/build/badge.svg)

This action generates a Github Actions Check report with annotations for NUnit-formatted Pester tests.

## Inputs

### `github_token`

**Required** - GitHub token to generate Pester report, usually: `${{ secrets.GITHUB_TOKEN }}`.


### `path`

Optional - Glob path of the pester tests . Default `**/test-reports/TEST-*.xml`.

### `name`

Optional - Name of the generated report. Default `Test Report`.


## Example usage
```yml
- uses: Azure/powershell@v1
  with:
    inlineScript: |
        Install-Module -Name Pester -Force
        Invoke-Pester './tests/*.tests.ps1' -OutputFile './test-reports/TEST-CI.xml' -OutputFormat 'NUnitXML'
    azPSVersion: 'latest'

- uses: bart-jansen/action-pester-report@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    path: '**/test-reports/TEST-*.xml'
```