# 将项目推送到GitHub

这个文档提供了如何将项目推送到GitHub的指南。

## 前提条件

1. 已创建GitHub账号
2. 已在GitHub上创建新的空仓库
3. 已安装并配置Git

## 推送步骤

### 1. 添加远程仓库

使用以下命令添加远程仓库，替换`USERNAME`和`REPOSITORY`为你的GitHub用户名和仓库名：

```bash
git remote add origin https://github.com/USERNAME/REPOSITORY.git
```

例如：

```bash
git remote add origin https://github.com/yourusername/studyspace-reservation.git
```

### 2. 推送master分支

首先，推送主分支：

```bash
git push -u origin master
```

### 3. 推送功能分支

然后推送我们的功能分支：

```bash
git push -u origin feature/profile-fixes
```

### 4. 创建Pull Request

1. 在GitHub上访问你的仓库
2. 你会看到一个提示，点击"Compare & pull request"
3. 添加Pull Request的标题和描述，例如：
   - 标题：修复个人信息保存功能
   - 描述：解决了个人资料无法保存的问题，优化了API错误处理，更新了项目文档
4. 点击"Create pull request"

## 补充说明

我们已经创建了以下分支：

- `master`: 主分支，包含初始版本
- `feature/profile-fixes`: 功能分支，包含个人信息保存功能的修复

在实际开发中，你应该：

1. 从master分支创建功能分支
2. 在功能分支上开发和测试
3. 通过Pull Request将功能分支合并到master
4. 合并后删除功能分支

## 分支内容

`feature/profile-fixes`分支包含以下改进：

1. 修复了用户个人资料无法保存的问题
2. 改进了API客户端的错误处理
3. 添加了数据库连接和用户数据测试脚本
4. 更新了项目文档
5. 添加了快速启动指南
6. 添加了Windows批处理启动脚本

这些改进确保了系统的稳定性和用户体验。 