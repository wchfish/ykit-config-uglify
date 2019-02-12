const fs = require('fs');
const path = require('path');

module.exports = function(opt, stats) {
    // 修改打包方式为压缩模式
    opt.m = opt.min = true;

    const callback = this.async();

    const processNum = 4;

    // TODO: modify dist是输出目录，应该由外部传进来，而不是写死在回调中
    const dist = path.resolve(process.cwd(), 'prd');

    const computecluster = require('compute-cluster');
        const cc = new computecluster({
            module: path.resolve(__dirname, '../modules/minWorker.js'),
            max_backlog: -1,
            max_processes: processNum
        });

        spinner.start();

        const assetsInfo = stats.toJson({
            errorDetails: false
        }).assets;
        let processToRun = assetsInfo.length;

        const originAssets = stats.compilation.assets;
        const nextAssets = {};

        assetsInfo.forEach(asset => {
            cc.enqueue(
                {
                    opt: opt,
                    cwd: dist,
                    // buildOpts: this.build || this.config.build || {},
                    buildOpts: {},
                    assetName: asset.name
                },
                (err, response) => {
                    if (response.error) {
                        // err log
                        const resErr = response.error;
                        spinner.text = '';
                        spinner.stop();
                        logError(`Error occured while minifying ${resErr.assetName}\n${resErr.errorSource}`);

                        process.exit(1);
                    }

                    // 将替换版本号的资源名取代原有名字
                    const replacedAssets = response.replacedAssets;
                    if (replacedAssets && replacedAssets.length > 0) {
                        const originAssetName = replacedAssets[0];
                        const nextAssetName = replacedAssets[1];
                        if (originAssets[originAssetName]) {
                            nextAssets[nextAssetName] = originAssets[originAssetName];
                        }
                    }

                    processToRun -= 1;
                    spinner.text = `[Minify] ${assetsInfo.length -
                        processToRun}/${assetsInfo.length} assets`;

                    if(processToRun === 0) {
                        cc.exit();
                        spinner.stop();

                        // 更新 stats
                        stats.compilation.assets = Object.keys(nextAssets).length > 0
                            ? nextAssets
                            : originAssets;
                        // compilerStats = stats;
                        // resolve();
                        callback(null);
                    }
                }
            );
        });

    // callback(null);
}