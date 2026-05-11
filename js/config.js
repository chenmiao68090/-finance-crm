// Supabase 配置
// 请将下面的 URL 和 Key 替换为你自己的 Supabase 项目凭据

const SUPABASE_URL = 'https://pptnpamqdngvykenhedt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6XdF7QQ1wjzTY8ihQ-cXBg_qFjHUSEd';

// 初始化 Supabase 客户端
try {
    if (window.supabase) {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabase;
    } else {
        console.warn('Supabase SDK 未加载，使用本地模式');
        window.supabaseClient = null;
    }
} catch (e) {
    console.warn('Supabase 初始化失败，使用本地模式:', e);
    window.supabaseClient = null;
}
