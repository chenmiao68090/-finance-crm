// 云存储模块 - 浙杭企服
// 用于将本地数据同步到 Supabase 云端（待实现）

const CloudStorage = {
    isAvailable() {
        return !!window.supabaseClient;
    }
};
