#!/usr/bin/env node
import prompts from 'prompts';
import { createSpinner } from 'nanospinner';
import fs from 'fs';

import path from 'path';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

import { red, green, reset } from 'kolorist';

import {
  formatTargetDir,
  editFile,
  commonPackage,
  commonEslintConfig,
  eslintIgnore,
  commonPrettierrcConfig,
  commonVsCodeConfig,
} from '../packages/utils/index.js';
const defaultTargetDir = 'vite-vue-project';

// eslint-disable-next-line no-undef
const cwd = process.cwd();

async function init() {
  // project目录
  let targetDir = defaultTargetDir;

  let result;

  try {
    result = await prompts([
      {
        type: 'text',
        name: 'projectName',
        message: reset('Project name:'),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir;
        },
      },
      {
        type: (_, { overwrite }) => {
          if (overwrite === false) {
            throw new Error(red('✖') + ' Operation cancelled');
          }
          return null;
        },
        name: 'overwriteChecker',
      },
      {
        type: 'select',
        name: 'projectType',
        message: '选择项目类型',
        choices: [
          {
            title: 'base',
            value: 'base',
          },
          {
            title: 'ts',
            value: 'ts',
          },
        ],
      },
      {
        type: 'select',
        name: 'pkgManage',
        message: '选择包管理器',
        choices: [
          { title: 'npm', value: 'npm' },
          { title: 'yarn', value: 'yarn' },
          { title: 'pnpm', value: 'pnpm' },
        ],
      },
    ]);

    const root = path.join(cwd, targetDir);

    const { projectName, projectType, pkgManage } = result;

    const spinner = createSpinner('vite create...').start();

    if (!projectName) return;
    if (fs.existsSync(targetDir)) {
      spinner.error({ text: 'Project name 已存在', mark: ':(' });
      return;
    }

    const isTs = projectType === 'ts';

    const eslintFile = path.join(root, '.eslintrc.json');
    const prettierFile = path.join(root, '.prettierrc.json');
    const eslintIgnoreFile = path.join(root, '.eslintignore');
    const vscodeSetting = path.join(root, '.vscode/setting.json');

    const { packages, eslintOverrides } = await import(`../packages/config/${projectType}.js`);

    const lastPackage = [...commonPackage, ...packages];
    const lastEslintConfig = {
      ...commonEslintConfig,
      overrides: [...commonEslintConfig.overrides, ...eslintOverrides],
    };

    const initCommand = {
      npm: `npm create vite@latest ${projectName} --template ${isTs ? 'vue-ts' : 'vue'}`,
      yarn: `yarn create vite ${projectName} --template ${isTs ? 'vue-ts' : 'vue'}`,
      pnpm: `pnpm create vite ${projectName} --template ${isTs ? 'vue-ts' : 'vue'}`,
    };
    const commandMap = {
      npm: `npm install --save-dev ${lastPackage.join(' ')}`,
      yarn: `yarn add --dev ${lastPackage.join(' ')}`,
      pnpm: `pnpm install --save-dev ${lastPackage.join(' ')}`,
    };
    const installMap = {
      npm: `npm i`,
      yarn: `yarn`,
      pnpm: `pnpm`,
    };

    await execPromise(`${initCommand[pkgManage]}`);

    spinner.success('vite create success');

    // 修改tsconfig.json的 baseUrl和paths
    if (isTs) {
      editFile(path.resolve(root, `tsconfig.json`), (content) => {
        const data = JSON.parse(content.replace(/\/\/.*|\/\*.*\*\//g, ''));
        data.compilerOptions.baseUrl = './';
        data.compilerOptions.paths = { '@/*': ['./src/*'] };

        return JSON.stringify(data, null, 2);
      });
    }

    spinner.spin('install packages...');
    await execPromise(`${installMap[pkgManage]}`, { cwd: root });

    spinner.success({ text: 'success to install packages!' }),
      await execPromise(`${commandMap[pkgManage]}`, { cwd: root });

    fs.writeFileSync(eslintFile, JSON.stringify(lastEslintConfig, null, 2));
    fs.writeFileSync(prettierFile, JSON.stringify(commonPrettierrcConfig, null, 2));
    fs.writeFileSync(eslintIgnoreFile, eslintIgnore.join('\n'));
    fs.writeFileSync(vscodeSetting, JSON.stringify(commonVsCodeConfig, null, 2));

    spinner.success({ text: green('All done! 🎉'), mark: '✔' });
  } catch (error) {
    console.log(error);
  }
}

init().catch((e) => {
  console.error(e);
});
