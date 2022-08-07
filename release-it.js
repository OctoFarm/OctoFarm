module.exports = {
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      header: "# :octopus: :octopus: OctoFarm's Changelog :octopus: :octopus:",
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
            section: ":dash: Code Improvements :dash:",
            hidden: false
          },
          {
            type: "perf",
            section: ":dash: Code Improvements :dash:",
            hidden: false
          },
          {
            type: "test",
            section: ":link: Testing Updated :link:",
            hidden: false
          },
          {
            type: "breaking",
            section: ":boom: BREAKING CHANGE :boom:",
            hidden: false
          },
          {
            type: "revert",
            section: ":x: Removed :x:",
            hidden: false
          },
          {
            type: "ci",
            section: ":curly_loop: Continuous Integrations :curly_loop:",
            hidden: false
          },
          {
            type: "chore",
            section: ":curly_loop: What a drag! :curly_loop:",
            hidden: true
          }
        ]
      }
    }
  },
  git: {
    commitMessage: "chore(release): octofarm release v${version}",
    commit: true,
    tag: true,
    push: true,
    requireCleanWorkingDir: false,
    tagName: "${version}"
  },
  npm: {
    publish: false
  },
  github: {
    release: true,
    releaseName: "Release ${version}"
  },
  hooks: {
    "after:bump": ["rm -Rf ../server/views/assets/dist", "cd ./client", "npm ci --no-optional", "npm run build", "git add ."],
  }
};
