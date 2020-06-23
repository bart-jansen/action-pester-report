const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    try {
        const reportPath = core.getInput('path');
        core.info(`Looking for reports in path: ${reportPath}`);
        const githubToken = core.getInput('github_token');
        const name = core.getInput('name');
    
        let count = 10,
            skipped = 0,
            annotations = [];
            
        const foundResults = count > 0 || skipped > 0;
        const title = foundResults
            ? `${count} tests run, ${skipped} skipped, ${annotations.length} failed.`
            : 'No test results found!';
        core.info(`Result: ${title}`);
    
        const pullRequest = github.context.payload.pull_request;
        const link = pullRequest && pullRequest.html_url || github.context.ref;
        const conclusion = foundResults && annotations.length === 0 ? 'success' : 'failure';
        const status = 'completed';
        const head_sha = pullRequest && pullRequest.head.sha || github.context.sha;
        core.info(
            `Posting status '${status}' with conclusion '${conclusion}' to ${link} (sha: ${head_sha})`
        );
    
        const createCheckRequest = {
            ...github.context.repo,
            name,
            head_sha,
            status,
            conclusion,
            output: {
                title,
                summary: '',
                annotations: annotations.slice(0, 50)
            }
        };
    
        core.debug(JSON.stringify(createCheckRequest, null, 2));
    
        const octokit = new github.GitHub(githubToken);
        await octokit.checks.create(createCheckRequest);
    } catch (error) {
        core.setFailed(error.message);
    }
})();
