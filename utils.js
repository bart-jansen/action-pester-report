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

// edited from https://stackoverflow.com/a/15643382
const findNested = (obj, key, pwshScript, res) => {
    var i,
        proto = Object.prototype,
        ts = proto.toString,
        hasOwn = proto.hasOwnProperty.bind(obj);

    if ('[object Array]' !== ts.call(res)) res = [];

    for (i in obj) {
        if (hasOwn(i)) {
            if (i === key) {
                obj[i].pwshScript = pwshScript;
                res.push(obj[i]);
            } else if ('[object Array]' === ts.call(obj[i]) || '[object Object]' === ts.call(obj[i])) {
                if(obj[i] && obj[i].name && obj[i].name.includes('.ps1')) {
                    // get pwsh file name from full path
                    pwshScript = obj[i].name.replace(/^.*[\\\/]/, '');
                }
                findNested(obj[i], key, pwshScript, res);
            }
        }
    }

    return res;
}

async function parseFile(file) {
    core.info(`Parsing file ${file}`);
    let count = 0,
        skipped = 0,
        annotations = [],
        fileName;

    const data = await fs.promises.readFile(file);
    const testResults = JSON.parse(parser.xml2json(data, { compact: true }))['test-results'];

    let testObj = findNested(testResults, 'test-case', '', []);

    for (let testCases of testObj) {
        fileName = testCases.pwshScript;

        // place non-iterable test cases in array to allow iterating
        !Array.isArray(testCases) ? testCases = [testCases] : ''

        for (const testCase of testCases) {
            count++;
    
            if (testCase.skipped) skipped++;
            
            if (testCase.failure || testCase.error) {
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
    
                const line = 7;
    
                const path = await resolvePath(fileName);
                const title = testCase._attributes.name;
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
