# Git 常用命令

## 初始化

- `git init` 初始化项目版本控制

## 克隆仓库

- `git clone 仓库地址` 克隆远程仓库
- `git clone -b template 仓库地址` 克隆远程仓库的 template 分支

## 远程仓库

- `git remote add origin 仓库地址` 添加一个远程仓库(origin 为常用仓库别名)
- `git remote -v` 查看远程仓库列表。
- `git push origin master` 推送代码到远程的 master 分支
- `git push -u origin master` 使用 `-u` 选项指定默认仓库和分支后，可直接 `git push` 推送
- `git push` 推送代码到默认远程分支

## 分支操作

- `git branch dev` 新建 dev 分支
- `git branch` 查看本地有哪些分支
- `git branch -a` 查看所有分支（包含本地和远程）
- `git branch -D dev` 删除本地 dev 分支
- `git checkout dev` 切换到 dev 分支
- `git checkout -b dev` 新建并切换到 dev 分支
- `git checkout -b dev origin/dev` 本地新建 dev 分支和拉取远程 dev 分支内容并跟踪

## 代码暂存和提交

- `git status` 查看修改了哪些文件
- `git add .` 把修改的文件提交到暂存区
- `git commit -m 提交备注` 把代码提交到本地
- `git push` 推送代码到默认远程仓库

## 标签和版本

- `git tag v1.0.0` 创建一个指向最新提交的**轻量标签**
- `git tag v1.0.1 -m "修复已知bug"` 创建一个指向最新提交的**附注标签**
- `git push origin v1.0.0` 将标签推送到远程服务器
- `git tag -d v1.0.0` 删除本地标签

版本格式：主版本号.次版本号.修订号，版本号递增规则如下：

- 主版本号：当你做了不兼容的 API 修改。
- 次版本号：当你做了向下兼容的功能性新增。
- 修订号：当你做了向下兼容的问题修正。
- 遵循 [Semver](https://semver.org/lang/zh-CN/) 语义化版本规范。

## 其它操作

- `git log` 查看提交历史记录
- `git reset --hard commitID` 回退到某个版本
- `git push -f origin dev` 强制推送代码到远程的 dev 分支
