# 财务CRM管理系统 - 云端版

## 项目简介

这是一个功能完整的财务公司CRM系统,支持用户认证、云端数据存储、多设备同步。

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **部署**: Vercel(推荐)

## 功能模块

### 1. 用户系统
- ✅ 邮箱注册/登录
- ✅ 会话管理
- ✅ 数据安全隔离

### 2. 客户管理
- ✅ 客户信息录入
- ✅ 客户搜索
- ✅ 客户列表展示

### 3. 合同管理
- ✅ 合同创建(关联客户)
- ✅ 合同状态跟踪(执行中/已过期)
- ✅ 合同金额管理

### 4. 财务管理
- ✅ 收入/支出记录
- ✅ 按类型筛选
- ✅ 金额统计

### 5. 发票管理
- ✅ 发票录入
- ✅ 发票类型管理
- ✅ 开票日期跟踪

### 6. 数据看板
- ✅ 客户总数
- ✅ 合同总数
- ✅ 总收入/总支出
- ✅ 收入趋势图
- ✅ 客户分布图

## 项目结构

```
finance-crm/
├── index.html              # 主页面(含登录页)
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── config.js           # Supabase配置(需修改)
│   ├── auth.js             # 用户认证模块
│   ├── cloud-storage.js    # 云端数据存储层
│   ├── app.js              # 应用主逻辑
│   └── storage.js          # 旧版本地存储(已废弃)
├── database-setup.sql      # 数据库初始化脚本
├── DEPLOY.md               # 完整部署文档
├── 快速入门.md              # 5分钟快速上手
└── README.md               # 本文件
```

## 快速开始

### 1. 创建Supabase项目
访问 https://supabase.com 注册并创建项目

### 2. 配置数据库
在SQL Editor中执行 `database-setup.sql`

### 3. 修改配置
编辑 `js/config.js`,填入你的Supabase凭据:
```javascript
const SUPABASE_URL = 'https://你的项目ID.supabase.co';
const SUPABASE_ANON_KEY = '你的anon密钥';
```

### 4. 运行测试
直接用浏览器打开 `index.html`

### 5. 部署上线
参考 `DEPLOY.md` 部署到Vercel

## 数据安全

- ✅ HTTPS加密传输
- ✅ PostgreSQL行级安全策略(RLS)
- ✅ 用户数据完全隔离
- ✅ JWT会话认证

## 免费额度

- **Supabase**: 500MB数据库 + 5万月活用户
- **Vercel**: 100GB带宽
- **总成本**: ¥0/月

## 版本历史

### v2.0 云端版 (当前版本)
- 添加用户认证
- 数据云端存储
- 多设备同步
- 数据安全隔离

### v1.0 本地版
- 纯前端实现
- localStorage存储
- 单设备使用

## 后续规划

- [ ] 团队协作功能
- [ ] 角色权限管理
- [ ] 客户分配
- [ ] 实时数据同步
- [ ] 数据导出Excel
- [ ] 移动端APP

## 许可证

本项目仅供学习和内部使用。

## 技术支持

- Supabase文档: https://supabase.com/docs
- Vercel文档: https://vercel.com/docs

---

**开发完成日期**: 2026-05-11
