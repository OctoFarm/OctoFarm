module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'fix',
        'feat',
        'refactor',
        'perf',
        'test',
        'database',
        'breaking',
        'security',
        'removed',
        'ci',
        'chore',
        'style'
      ],
    ],
    'footer-max-line-length': [0, 'always'],
    'body-max-line-length': [0, 'always'],
  },
};