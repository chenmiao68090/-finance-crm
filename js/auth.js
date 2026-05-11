// 用户认证模块

const Auth = {
    currentUser: null,

    // 初始化认证状态
    async init() {
        // 先绑定表单事件，确保无论Supabase是否可用都能操作
        this.bindLoginForm();
        this.bindRegisterForm();

        // 检查本地保存的登录状态
        const localSession = localStorage.getItem('zhqf_local_session');
        if (localSession) {
            try {
                this.currentUser = JSON.parse(localSession);
                this.showApp();
                return;
            } catch (e) {
                localStorage.removeItem('zhqf_local_session');
            }
        }

        try {
            if (!window.supabaseClient) throw new Error('Supabase未连接');
            // 检查当前会话
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                this.showApp();
            } else {
                this.showLogin();
            }

            // 监听认证状态变化
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    this.currentUser = session.user;
                    this.showApp();
                    if (window.refreshDashboard) {
                        window.refreshDashboard();
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.showLogin();
                }
            });

        } catch (error) {
            console.error('认证初始化失败:', error);
            this.showLogin();
        }
    },

    // 登录
    async login(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;
        return data;
    },

    // 注册
    async register(email, password) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;
        return data;
    },

    // 登出
    async logout() {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
    },

    // 显示登录页
    showLogin() {
        document.getElementById('login-page').style.display = 'flex';
        document.querySelector('.app-container').style.display = 'none';
    },

    // 显示主应用
    showApp() {
        document.getElementById('login-page').style.display = 'none';
        document.querySelector('.app-container').style.display = 'flex';
        
        // 更新用户信息显示
        if (this.currentUser) {
            const userEmail = this.currentUser.email;
            document.querySelector('.user-info span').textContent = userEmail;
        }

        // 登录后默认加载首页
        if (typeof navigateTo === 'function') {
            navigateTo('home');
        }
    },

    // 绑定登录表单
    bindLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMsg = loginForm.querySelector('.error-message');

            // 本地测试账号
            if (email === 'chenmiao' && password === '123456') {
                this.currentUser = { email: email };
                localStorage.setItem('zhqf_local_session', JSON.stringify(this.currentUser));
                this.showApp();
                errorMsg.textContent = '';
                return;
            }

            try {
                this.showLoading();
                await this.login(email, password);
                errorMsg.textContent = '';
            } catch (error) {
                errorMsg.textContent = error.message || '登录失败,请检查账号和密码';
            } finally {
                this.hideLoading();
            }
        });

        // 密码显示/隐藏切换
        const toggleBtn = loginForm.querySelector('.toggle-password');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const pwdInput = loginForm.querySelector('input[type="password"], input[type="text"]#login-password');
                if (pwdInput) {
                    const isPassword = pwdInput.type === 'password';
                    pwdInput.type = isPassword ? 'text' : 'password';
                    toggleBtn.classList.toggle('active', isPassword);
                }
            });
        }
    },

    // 绑定注册表单
    bindRegisterForm() {
        const registerBtn = document.getElementById('register-btn');
        if (!registerBtn) return;

        registerBtn.addEventListener('click', async () => {
            const loginForm = document.getElementById('login-form');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMsg = loginForm.querySelector('.error-message');

            if (!email || !password) {
                errorMsg.textContent = '请填写邮箱和密码';
                return;
            }

            if (password.length < 6) {
                errorMsg.textContent = '密码长度至少6位';
                return;
            }

            try {
                this.showLoading();
                const data = await this.register(email, password);
                
                if (data.user) {
                    errorMsg.textContent = '';
                    errorMsg.style.color = '#10b981';
                    errorMsg.textContent = '注册成功!请检查邮箱验证邮件(如需验证)';
                    
                    // 如果不需要邮箱验证,自动登录
                    if (data.session) {
                        this.currentUser = data.user;
                        this.showApp();
                        if (window.refreshDashboard) {
                            window.refreshDashboard();
                        }
                    }
                }
            } catch (error) {
                errorMsg.textContent = error.message || '注册失败';
            } finally {
                this.hideLoading();
            }
        });
    },

    // 绑定登出按钮
    bindLogoutButton() {
        const logoutBtn = document.getElementById('logout-btn');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', async () => {
            try {
                this.showLoading();
                if (window.supabaseClient) {
                    await this.logout();
                }
            } catch (error) {
                console.error('登出失败:', error);
            } finally {
                this.hideLoading();
                this.currentUser = null;
                localStorage.removeItem('zhqf_local_session');
                this.showLogin();
            }
        });
    },

    // 显示加载状态
    showLoading() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner">加载中...</div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // 获取当前用户
    getUser() {
        return this.currentUser;
    },

    // 检查是否已登录
    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// 页面加载时初始化认证
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    Auth.bindLogoutButton();
});
