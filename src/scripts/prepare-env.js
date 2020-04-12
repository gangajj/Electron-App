const shell = require('shelljs');
const childProcess = require('child_process');
const fs = require('fs');

let env = 'local';
if (!process.env.NODE_ENV) {
    shell.env['NODE_ENV'] = env;
} else {
    env = process.env.NODE_ENV;
}

console.log('Using environment:' + env);

/*
console.log("Getting git details");
const gitRevision = childProcess.execSync('git rev-parse --short HEAD').toString().trim();
const gitBranch = childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
console.log(`Git info: branch=${gitBranch}, revision=${gitRevision}`);

const rawEnvJson = fs.readFileSync(`./src/config/env-${env}.json`);
const envJson = JSON.parse(rawEnvJson);
envJson.git = {
    branch : gitBranch,
    revision : gitRevision
};
const envJsonAsString = JSON.stringify(envJson);
fs.writeFileSync('./src/env.json', envJsonAsString);
*/