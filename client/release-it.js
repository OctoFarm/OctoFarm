module.exports = {
  git: {
    commitMessage: "chore(release): client release v${version}",
    commit: true,
    tag: true,
    push: true,
    requireCleanWorkingDir: false,
    tagName: "client ${version}"
  },
  npm: {
    publish: true,
    publishPath: ".",
    skipChecks: true
  },
  github: {
    release: false,
  },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      header: "# :octopus: :octopus: OctoFarm's Client Changelog :octopus: :octopus:",
      parserOpts: {
        headerPattern: "^(\\w*)(?:\\((client*)\\))?\\: (.*)$"
      },
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
      }
    }
  }
};
