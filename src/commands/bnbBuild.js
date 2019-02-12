'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const child_process = require('child_process');
const requireg = require('requireg');

const UtilFs = require('../utils/fs.js');

exports.usage = '民宿项目构建打包压缩';

exports.setOptions = (optimist) => {
    optimist.alias('m', 'min');
    optimist.describe('m', '是否压缩资源');
};

const npmInstall =  exports.npmInstall = function() {
    let isProduction = false;
    if(process.argv.includes('-p') || process.argv.includes('--production')) {
        isProduction = true;
    }

    let currentNpm = null;
    const cwd = process.cwd();
    let userRegistry = 'http://npmrepo.corp.qunar.com';

    for(let i = 0; i < process.argv.length; i++) {
        if(process.argv[i] === '--registry' || process.argv[i] === '-r' ) {
            userRegistry = process.argv[i + 1];
        }
    }

    // 检测是否存在 ykit.*.js
    const configFile = globby.sync(['ykit.*.js', 'ykit.js'], { cwd: cwd })[0];
    if(!configFile) {
        logError('Local ykit.js not found in' + cwd);
        process.exit(1);
    }

    // 检测是否存在 node_modules
    const isNodeModulesExists = fs.existsSync(sysPath.join(cwd, 'node_modules'));
    if(isNodeModulesExists) {
        logError('Find node_modules in the current directory which can cause compilation failure.');
        logError('Please remove it from your registry.');
        logInfo('Visit ' + 'https://ykit.ymfe.org/guide/build-prd.html'.underline + ' for doc.');
        process.exit(1);
    }

    let ncsEnabled = true;

    const ykitOptions = require(sysPath.join(cwd, 'package.json')).ykit || {};
    if(ykitOptions.skipNpmCache) {
        ncsEnabled = false;
    } else {
        try {
            child_process.execSync('npm_cache_share');
        } catch (e) {
            ncsEnabled = false;
        }
    }

    if(UtilFs.fileExists(sysPath.join(cwd, 'yarn.lock'))) {
        checkModuleResolvePath(sysPath.join(cwd, 'yarn.lock'));
        currentNpm = ncsEnabled ? 'npm_cache_share' : 'yarn';
        log(`Installing npm modules with ${ncsEnabled ? 'npm_cache_share + ' : ''}yarn.`);
    } else if(UtilFs.fileExists(sysPath.join(cwd, 'npm-shrinkwrap.json'))) {
        checkModuleResolvePath(sysPath.join(cwd, 'npm-shrinkwrap.json'));
        currentNpm = ncsEnabled ? 'npm_cache_share' : 'npm';
        log(`Installing npm modules with ${ncsEnabled ? 'npm_cache_share + ' : ''}npm.`);
    } else {
        currentNpm = 'npm';
        log('Installing npm modules with npm.');
        logWarn('Please use yarn or shrinkwrap to lock down the versions of packages.');
        logDoc('https://ykit.ymfe.org/guide/shrinkwrap.html');
    }

    // install
    let installParams = `--registry ${userRegistry} ${isProduction ? '--production' : ''}`;
    if(currentNpm === 'npm_cache_share') {
        installParams += ' -d -f';
    } else if (currentNpm === 'yarn') {
        installParams += ' --non-interactive';
    }
    const installCmd = (
        `${currentNpm} install ${installParams}`
    );

    execute(installCmd);
};

// 替换ykit默认的build命令
// 修改pack命令执行时的参数，新参数只在插件中有效。
exports.run = function(options) {
    // 在build命令中，ykit会自动调用npmInstall
    // 在自定义命令中，npmInstall需要在run函数中手动调用

    // TODO: 包安装命令需要在jenkins下运行，暂时注释
    const ykitOptions = require(path.join(process.cwd(), 'package.json')).ykit || {};
    if(ykitOptions.skipBuilding) {
        logInfo('Skip building.');
        return;
    } else {
        npmInstall();
    }

    // 构建执行
    const min = !(options.m === 'false' || options.min === 'false');
    const x = options.x || options['custom-webpack-plugin'] || false;

    // display version info
    process.stdout && process.stdout.write('node version: ') && execute('node -v');
    process.stdout && process.stdout.write('npm version: ') && execute('npm -v');
    execute('ykit -v');

    // build
    // const cmd = `ykit pack -q ${min ? '-m' : ''} ${x ? '-x' : ''}`;
    const cmd = `ykit pack -m -bnb`;
    log('Start building. [Pack cammand] ', cmd);
    execute(cmd);

    // TODO: 注释的两个命令可能对项目影响较大，还没有完全搞清楚，暂时不执行。
    clearGitHooks();
    clearNodeModules();

    log('Finish building.\n');
};

function execute(cmd) {
    if (!cmd) {
        return;
    }

    const child = shell.exec(cmd, {
        silent: false,
        async: false
    });

    if (child.code !== 0) {
        logError('Building encounted error while executing ' + cmd);
        process.exit(1);
    }

    return;
}

function clearGitHooks() {
    const gitHooksDir = './.git/hooks/';

    if (UtilFs.dirExists(gitHooksDir)) {
        fs.readdirSync(gitHooksDir).forEach(function(file) {
            const currentPath = path.join(gitHooksDir, file);
            fs.writeFileSync(currentPath, '');
        });
        log('Local git hooks have been cleared.');
    }
}

function clearNodeModules() {
    shell.rm('-rf', 'node_modules');
    log('Local node_modules directory has been cleared.');
}

function checkModuleResolvePath(filePath) {
    const lockFileName = path.basename(filePath);
    const lockFileContent = fs.readFileSync(filePath, 'utf-8');
    const npmjsPathMatchResult = lockFileContent.match(/registry\.npmjs\.org/g);
    if(npmjsPathMatchResult) {
        logWarn(
            `According to ${lockFileName}, `
            + `there are ${npmjsPathMatchResult.length} packages installed from official registry`
            + '(https://registry.npmjs.org/). '
            + 'This may slow down the build process.'
        );
        logDoc('https://ykit.ymfe.org/docs-npm%20shrinkwrap.html');
    }
}
