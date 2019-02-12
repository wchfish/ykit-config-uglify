# ykit-config-uglify
ykit插件,修改了ykit默认的压缩方式,生成线上代码的source map,便于跟踪线上的异常。

## 功能说明
<!-- 1. 增加自定义的bnbBuild命令，替换当前使用的build命令。
2. pack命令增加自定义参数-bnb,使用该参数时会屏蔽ykit默认的压缩行为，使用新的压缩方式。 -->
3. 修改了ykit pack -m 命令的默认代码压缩方式。

## usage
<!-- 1. 线上环境发布命令：
   ```
   ykit bnbBuild
   ```
2. 新的打包方式(压缩chunk文件并生成source map)：
   ```
   ykit pack -m -bnb
   ``` -->
1. 线上环境打包：
```
ykit build
```

## 插件使用方法
参考ykit官方文档：
[yki 插件](http://ued.qunar.com/ykit/plugin/plugin.html)