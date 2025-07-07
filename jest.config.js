module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '\.(css|less|scss|sass)$': '<rootDir>/src/tests/__mocks__/styleMock.js',
    '\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\.(js|jsx)$': 'babel-jest'
  }
};
