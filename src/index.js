const beforeCompiling = require('./hooks/beforeCompiling');
const afterPack = require('./hooks/afterPack');

//  判断是否修改压缩方式，生成线上代码的source map
const isBnbBuild = function() {
    return process.argv[3] === '-m' ||
        process.argv[3] === '-min' ||
        process.argv[4] === '-m' ||
        process.argv[4] === '-min';
}

exports.config = function(options, cwd) {
    isBnbBuild() && this.packCallbacks.push(afterPack);
};

// 放弃使用自定义命令构建项目
// exports.commands = [
//     {
//         name: 'bnbBuild',
//         module: require('./commands/bnbBuild.js')
//     }
// ];

exports.hooks = {
    beforeCompiling: function(opt, webpackConfig) {
        isBnbBuild() && beforeCompiling(opt, webpackConfig)
    }
}