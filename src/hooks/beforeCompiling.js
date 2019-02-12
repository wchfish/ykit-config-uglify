// 打包模式修改为非压缩模式
module.exports = function(opt, webpackConfig) {
    opt.m = opt.min = false;
};