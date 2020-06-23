const glob = require('@actions/glob');
const core = require('@actions/core');
const fs = require('fs');
const parser = require('xml-js');

const resolvePath = async filename => {
    core.debug(`Resolving path for ${filename}`);
    const globber = await glob.create(`**/${filename}.*`, { followSymbolicLinks: false });
    const results = await globber.glob();
    core.debug(`Matched files: ${results}`);
    const searchPath = globber.getSearchPaths()[0];
    const path = results.length ? results[0].slice(searchPath.length + 1) : filename;
    core.debug(`Resolved path: ${path}`);

    return path;
};

async function parseFile(file) {
    console.log(`Parsing file ${file}`);
    let count = 0;
    let skipped = 0;
    let annotations = [];

    const data = await fs.promises.readFile(file);
    const testResults = JSON.parse(parser.xml2json(data, { compact: true }))['test-results'];

    const testCases = testResults['test-suite']['results']['test-suite']['results']['test-suite']['results']['test-case'];

    for (const testCase of testCases) {
        count++;
        console.log(testCase)

        if (testCase.skipped) skipped++;
        
        if (testCase.failure || testCase.error) {
            console.log('jaaaa error');
            console.log( testCase.failure);
            const stackTrace = (
                (testCase.failure && testCase.failure['stack-trace']._text) ||
                (testCase.error && testCase.error['stack-trace']._text) ||
                ''
            ).trim();

            const message = (
                (testCase.failure && testCase.failure.message._text) ||
                (testCase.error && testCase.error.message._text) ||
                stackTrace.split('\n').slice(0, 2).join('\n')
            ).trim();

            const fileName = 'get-emoji.tests.ps1';
            const line = 7;

            const path = await resolvePath(fileName);
            const title = `${fileName}.${testCase._attributes.name}`;
            core.info(`${path}:${line} | ${message.replace(/\n/g, ' ')}`);

            annotations.push({
                path,
                start_line: line,
                end_line: line,
                start_column: 0,
                end_column: 0,
                annotation_level: 'failure',
                title,
                message,
                raw_details: stackTrace
            });
        }
    }

    return { count, skipped, annotations };
}

const parseTestReports = async reportPath => {
    const globber = await glob.create(reportPath, { followSymbolicLinks: false });
    let annotations = [];
    let count = 0;
    let skipped = 0;
    for await (const file of globber.globGenerator()) {
        const { count: c, skipped: s, annotations: a } = await parseFile(file);
        count += c;
        skipped += s;
        annotations = annotations.concat(a);
    }
    return { count, skipped, annotations };
};

module.exports = { resolvePath, parseFile, parseTestReports };
