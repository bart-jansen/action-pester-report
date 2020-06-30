module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(12);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 12:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const core = __webpack_require__(381);
const github = __webpack_require__(974);
const { parseTestReports } = __webpack_require__(696);

(async () => {
    try {
        const reportPath = core.getInput('path');
        core.info(`Looking for reports in path: ${reportPath}`);
        const githubToken = core.getInput('github_token');
        const name = core.getInput('name');
    
        let { count, skipped, annotations } = await parseTestReports(reportPath);

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
    
        core.debug(JSON.stringify(createCheckRequest));
    
        const octokit = github.getOctokit(githubToken);
        await octokit.checks.create(createCheckRequest);
    } catch (error) {
        core.setFailed(error.message);
    }
})();


/***/ }),

/***/ 312:
/***/ (function(module) {

module.exports = eval("require")("@actions/glob");


/***/ }),

/***/ 381:
/***/ (function(module) {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 515:
/***/ (function(module) {

module.exports = eval("require")("xml-js");


/***/ }),

/***/ 696:
/***/ (function(module, __unusedexports, __webpack_require__) {

const glob = __webpack_require__(312);
const core = __webpack_require__(381);
const fs = __webpack_require__(747);
const parser = __webpack_require__(515);

const resolvePath = async filename => {
    core.debug(`Resolving path for ${filename}`);
    const globber = await glob.create(`**/${filename}*`, { followSymbolicLinks: false });
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
    
                const line = 11;
    
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


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 974:
/***/ (function(module) {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ });