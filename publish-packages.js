const exec = require('util').promisify(require('child_process').exec);
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const octokit = new Octokit({ auth: process.env.NODE_PRE_GYP_GITHUB_TOKEN });

const repo = { owner: 'mmomtchev', repo: 'EDCarnage' };
const version = require('./package.json').version;

(async () => {

  const branch = (await exec('git branch --show-current')).stdout.trim()
  process.stdout.write(`Creating release ${version} on branch ${branch}...`);

  let release = (await octokit.rest.repos.listReleases({
    ...repo,
  })).data.filter((r) => r.tag_name === `v${version}`)[0];

  if (!release) {
    release = (await octokit.rest.repos.createRelease({
      ...repo,
      tag_name: `v${version}`
    })).data;
  }

  process.stdout.write(`id is ${release.id}\n`);

  for (const asset of [`EDCarnage-${version}.zip`, `edcarnage Setup ${version}.exe`]) {
    process.stdout.write(`Uploading ${asset}\n`);
    await octokit.rest.repos.uploadReleaseAsset({
      ...repo,
      release_id: release.id,
      name: asset,
      data: fs.readFileSync(path.join('dist', asset)),
    });
  }

  process.stdout.write('success\n')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
