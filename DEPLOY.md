# 财务CRM系统云端版 - 部署指南

## 一、系统架构

```
用户浏览器 ←HTTPS→ Vercel(前端托管) ←API→ Supabase(数据库+认证)
```

## 二、创建Supabase项目(10分钟)

### 步骤1: 注册账号
1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用GitHub账号或邮箱注册

### 步骤2: 创建项目
1. 点击 "New Project"
2. 填写项目信息:
   - **Project name**: finance-crm (可自定义)
   - **Database Password**: 设置一个强密码(请牢记)
   - **Region**: **Singapore** 或 **Tokyo** (亚洲访问较快)
3. 点击 "Create new project"
4. 等待2-3分钟项目创建完成

### 步骤3: 获取API凭据
1. 进入项目后,点击左侧菜单 **Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下两个值:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (很长的字符串)

### 步骤4: 执行数据库脚本
1. 点击左侧菜单 **SQL Editor**
2. 点击 **New query**
3. 打开文件 `database-setup.sql`,复制全部内容
4. 粘贴到SQL Editor中
5. 点击 **Run** 执行
6. 看到 "Success. No rows returned" 表示成功

### 步骤5: 启用邮箱认证
1. 点击左侧菜单 **Authentication**
2. 点击 **Providers**
3. 找到 **Email**,确保已启用
4. 如需邮箱验证,可关闭 "Confirm email" 开关(推荐先关闭,方便测试)

## 三、配置前端(2分钟)

### 步骤1: 编辑配置文件
打开文件 `js/config.js`,修改以下两行:

```javascript
const SUPABASE_URL = 'https://你的项目ID.supabase.co';
const SUPABASE_ANON_KEY = '你的anon密钥';
```

**示例**:
```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 步骤2: 本地测试
1. 直接用浏览器打开 `index.html`
2. 注册一个新账号
3. 登录并测试添加客户、合同等功能
4. 刷新页面,验证数据是否保存成功

## 四、部署到Vercel(5分钟)

### 方案A: 使用Vercel网页部署(推荐,最简单)

1. 访问 https://vercel.com/new
2. 使用GitHub账号登录
3. 导入你的代码仓库(需先上传到GitHub)
4. 点击 **Deploy**
5. 部署完成后获得在线访问地址

### 方案B: 使用Vercel CLI命令行

1. **安装Node.js**(如未安装)
   - 访问 https://nodejs.org
   - 下载并安装LTS版本

2. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **部署项目**
   ```bash
   cd f:\陈苗工具\finance-crm
   vercel
   ```

4. **按提示操作**
   - 首次会要求登录(选择浏览器登录)
   - 询问是否创建新项目: 输入 `y`
   - 项目名称: 直接回车使用默认
   - 目录: 直接回车使用当前目录
   - 等待部署完成

5. **获得访问地址**
   - 部署成功后会显示URL,例如:
   - `https://finance-crm-xxxx.vercel.app`

### 方案C: 使用其他静态托管服务

也可使用以下服务(任选其一):
- **Netlify**: https://netlify.com
- **GitHub Pages**: 免费,但需配置
- **Cloudflare Pages**: 免费,速度快

## 五、验证部署

### 测试清单
- [ ] 可以用邮箱注册新账号
- [ ] 可以成功登录
- [ ] 可以添加客户数据
- [ ] 刷新页面后数据仍然存在
- [ ] 在手机浏览器登录同一账号,数据同步显示

### 查看数据库数据
1. 回到Supabase Dashboard
2. 点击 **Table Editor**
3. 查看 customers、contracts 等表
4. 应该能看到你通过网页添加的数据

## 六、使用教程

### 首次使用流程

1. **注册账号**
   - 打开网站
   - 输入邮箱和密码(至少6位)
   - 点击"注册"
   - 注册成功后自动登录

2. **添加客户**
   - 点击左侧"客户管理"
   - 点击"+ 新增客户"
   - 填写信息后保存

3. **创建合同**
   - 先添加客户(合同需关联客户)
   - 点击"合同管理"
   - 点击"+ 新增合同"
   - 选择客户并填写合同信息

4. **记录财务**
   - 点击"财务管理"
   - 点击"+ 新增记录"
   - 选择收入或支出

5. **管理发票**
   - 点击"发票管理"
   - 点击"+ 新增发票"
   - 选择客户并填写发票信息

### 数据同步说明
- 所有数据实时保存在云端
- 任何设备登录同一账号,数据完全同步
- 不同账号之间的数据完全隔离,互不可见

## 七、常见问题

### Q1: 注册时提示"Email already exists"
**A**: 该邮箱已注册过,请直接登录或更换邮箱

### Q2: 登录后页面空白
**A**: 检查浏览器控制台(F12)是否有错误,通常是config.js配置错误

### Q3: 添加数据时提示"未登录"
**A**: 登录会话已过期,请退出重新登录

### Q4: 能否多人协作?
**A**: 当前版本为单用户模式,每个账号数据独立。如需团队协作,可联系开发者升级多用户版本

### Q5: 数据安全吗?
**A**: 
- 数据存储在Supabase云端(PostgreSQL数据库)
- 使用HTTPS加密传输
- 每个用户只能访问自己的数据(RLS行级安全)
- 建议定期备份重要数据

### Q6: 免费额度用完后怎么办?
**A**: 
- Supabase免费版: 500MB数据库 + 5万月活用户
- 一般小团队完全够用
- 如需升级,Pro版$25/月

## 八、成本说明

| 服务 | 免费额度 | 实际使用 | 费用 |
|------|---------|---------|------|
| Supabase | 500MB DB + 50K用户 | 预计<100MB | ¥0 |
| Vercel | 100GB带宽 | 预计<1GB | ¥0 |
| **合计** | | | **¥0/月** |

## 九、后续升级建议

### v2.0可添加功能
1. 团队/组织功能(多人共享数据)
2. 角色权限(admin/editor/viewer)
3. 客户分配功能
4. 实时数据同步(多端同时编辑)
5. 数据导出Excel
6. 更多统计图表
7. 移动端APP

### 如何找开发者升级
1. 将本项目代码提供给开发者
2. 说明需要添加的功能
3. 开发者可在现有架构上扩展

## 十、技术支持

- Supabase文档: https://supabase.com/docs
- Vercel文档: https://vercel.com/docs
- 遇到问题可查看浏览器控制台(F12)的错误信息

---

**祝贺!你的财务CRM系统已成功上线!** 🎉
