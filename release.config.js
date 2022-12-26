
module.exports = {
  branches: ['master', { name: 'releases/releases-**', prerelease: false }, { name: 'betas/beta-**', prerelease: "beta" }],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          {type: "fix", release: "patch"},
          {type: "feat", release: "minor"},
          {type: "refactor", release: "patch"},
          {type: "perf", release: "patch"},
          {type: "test", release: false},
          {type: "database", release: "minor"},
          {type: "breaking", release: "major"},
          {type: "security", release:  "patch"},
          {type: "removed", release:  "patch"},
          {type: "ci", release:  false},
          {type: "chore", release:  false},
          {type: "style", release: "patch"}
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            {
              type: "fix",
              section: ":hammer: Bug Fix :hammer:",
            },
            {
              type: "feat",
              section: ":stars: New Feature :stars:",
            },
            {
              type: "refactor",
              section: ":persevere: Code Refactor :persevere:",
            },
            {
              type: "perf",
              section: ":dash: Performance Boost :dash:",
            },
            {
              type: "test",
              section: ":link: Test Implemented :link:",
            },
            {
              type: "breaking",
              section: ":boom: BREAKING CHANGE :boom:",
            },
            {
              type: "database",
              section: ":scroll: Database Change :scroll:",
            },
            {
              type: "security",
              section: ":key: Security Improvements :key:",
            },
            {
              type: "removed",
              section: ":x: Removed :x:",
            },
            {
              type: "ci",
              section: ":curly_loop: Continuous Integration :curly_loop:",
            },
            {
              type: "chore",
              section: ":curly_loop: What a drag! :curly_loop:",
            },
            {
              type: "style",
              section: ":dress: UI! :dress:",
            }
          ],
        },
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/exec',
      {
        // eslint-disable-next-line no-template-curly-in-string
        prepareCmd: 'VERSION=${nextRelease.version} && chmod +x scripts/run-build-sequence.sh && scripts/run-build-sequence.sh',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          'CHANGELOG.md',
          'package.json',
          'package-lock.json',
          'server/package.json',
          'server/package-lock.json',
          'client/package.json',
          'client/package-lock.json',
          'server/assets/**/*'
        ],
      },
    ],
    ['@semantic-release/github', {
      "assets": [
        {"path": "octofarm-*.zip", "label": "OctoFarm"}
      ]
    }],
    [
      "@semantic-release-plus/docker",
      {
        "name": {
          "registry": "docker.io",
          "namespace": "octofarm",
          "repository": "octofarm",
          "tag": "latest"
        }
      }
    ],
    [
      "@semantic-release-plus/docker",
      {
        "name": {
          "registry": "docker.io",
          "namespace": "octofarm",
          "repository": "octofarm",
          "tag": "monolithic-latest"
        }
      }
    ]
  ],
};
