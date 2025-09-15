module.exports = {
  root: true,
  extends: [],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'mongoose', message: 'Do not import mongoose in frontend' },
          { name: 'firebase-admin', message: 'Do not import firebase-admin in frontend' },
        ],
        patterns: [
          '**/BACKEND/**',
        ],
      },
    ],
  },
};

