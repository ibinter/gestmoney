/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^@gestmoney/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
    '^@gestmoney/database$': '<rootDir>/../../../packages/database/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
        // Les sources applicatives portent des écarts de types préexistants
        // (schéma Prisma EN vs champs FR, cf. commissions.service.ts). On
        // transpile sans vérification de types : les specs valident le
        // comportement d'exécution via des mocks, pas la compilation du source.
        isolatedModules: true,
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
};
