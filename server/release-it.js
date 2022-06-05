const fs = require("fs");
const path = require("path");

const commits_template = fs
  .readFileSync(path.resolve("../", "conventional-changelog.commit.hbs"))
  .toString();

const header_template = fs
  .readFileSync(path.resolve("../", "conventional-changelog.header.hbs"))
  .toString();

module.exports = {
  git: {
    commitMessage: "chore(release): server release v${version}",
    commit: true,
    tag: true,
    push: true,
    requireCleanWorkingDir: false
  },
  npm: {
    publish: false
  },
  github: {
    release: true,
    releaseName: "Release ${version}"
  },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "../CHANGELOG.md",
      preset: {
        name: "conventionalcommits",
        types: [
          {
            type: "fix",
            section: ":hammer: Bug Fixes :hammer:",
            hidden: false
          },
          {
            type: "feat",
            section: ":stars: New Features :stars:",
            hidden: false
          },
          {
            type: "refactor",
            section: ":persevere: Code Refactors :persevere:",
            hidden: false
          },
          {
            type: "perf",
            section: ":dash: Performance Boosts :dash:",
            hidden: false
          },
          {
            type: "test",
            section: ":link: Tests Implemented :link:",
            hidden: false
          },
          {
            type: "breaking",
            section: ":boom: BREAKING CHANGE :boom:",
            hidden: false
          },
          {
            type: "database",
            section: ":scroll: Database Changes :scroll:",
            hidden: false
          },
          {
            type: "security",
            section: ":key: Security Improvements :key:",
            hidden: false
          },
          {
            type: "removed",
            section: ":x: Removed :x:",
            hidden: false
          },
          {
            type: "ci",
            section: ":curly_loop: Continuous Integrations :curly_loop:",
            hidden: true
          },
          {
            type: "chore",
            section: ":curly_loop: What a drag! :curly_loop:",
            hidden: true
          },
          {
            type: "dependency",
            section: ":curly_loop: Dependency Hell! :curly_loop:",
            hidden: true
          }
        ]
      },
      writerOpts: {
        commitPartial: commits_template,
        headerPartial: header_template
      }
    }
  }
};
