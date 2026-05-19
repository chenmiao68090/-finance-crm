-- ==========================================
-- 财务CRM系统 - Supabase数据库初始化脚本
-- ==========================================
-- 使用说明:
-- 1. 登录 https://supabase.com 创建项目
-- 2. 进入 SQL Editor 页面
-- 3. 复制本脚本全部内容并执行
-- ==========================================

-- 1. 客户表
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 合同表
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 财务记录表
CREATE TABLE IF NOT EXISTS finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 发票表
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  invoice_date DATE NOT NULL,
  status TEXT DEFAULT '已开具',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 创建索引以提高查询性能
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_finances_user_id ON finances(user_id);
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(date);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- ==========================================
-- 启用行级安全策略 (RLS)
-- ==========================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 行级安全策略 - 用户只能访问自己的数据
-- ==========================================

-- 客户表策略
CREATE POLICY "user_data_policy_customers" ON customers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 合同表策略
CREATE POLICY "user_data_policy_contracts" ON contracts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 财务表策略
CREATE POLICY "user_data_policy_finances" ON finances
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 发票表策略
CREATE POLICY "user_data_policy_invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 创建触发器 - 自动更新 updated_at 字段
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finances_updated_at
    BEFORE UPDATE ON finances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 初始化完成!
-- ==========================================
-- 验证表是否创建成功:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('customers', 'contracts', 'finances', 'invoices');
-- ==========================================

-- ========================================
-- 呼叫中心模块表 (Call Center)
-- ========================================

-- 号码池
CREATE TABLE cc_phone_number (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    number VARCHAR(20) NOT NULL COMMENT '号码',
    number_type TINYINT COMMENT '1固话 2400号 395号 4手机号 5虚拟号',
    province VARCHAR(20),
    city VARCHAR(20),
    carrier VARCHAR(20),
    usage_type TINYINT COMMENT '1呼入 2呼出 3双向 4专属坐席号',
    trunk_id BIGINT COMMENT '关联SIP中继',
    status TINYINT DEFAULT 1 COMMENT '0停用 1正常 2欠费 3注销',
    bind_skillgroup_id BIGINT,
    display_strategy VARCHAR(50) COMMENT '外显策略',
    expire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SIP中继
CREATE TABLE cc_sip_trunk (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    trunk_type TINYINT COMMENT '1SIP中继 2E1 3IMS 4云API',
    supplier VARCHAR(50),
    server_host VARCHAR(100),
    username VARCHAR(100),
    password_enc VARCHAR(255) COMMENT '加密存储',
    max_concurrent INT DEFAULT 30,
    current_concurrent INT DEFAULT 0,
    alert_threshold INT DEFAULT 80,
    status TINYINT DEFAULT 1 COMMENT '0离线 1在线 2故障',
    rate_per_minute DECIMAL(10,4),
    recording_enabled TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技能组
CREATE TABLE cc_skill_group (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    biz_type VARCHAR(50) COMMENT '业务类型',
    priority INT DEFAULT 5,
    assign_strategy VARCHAR(30) COMMENT '分配策略',
    max_queue_wait INT DEFAULT 300 COMMENT '最大排队等待秒数',
    overflow_target_id BIGINT COMMENT '溢出目标技能组',
    work_time_config JSON COMMENT '工作时间JSON配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 坐席
CREATE TABLE cc_agent (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '关联sys_user',
    agent_no VARCHAR(20) UNIQUE COMMENT '坐席编号',
    extension VARCHAR(20) COMMENT '分机号',
    sip_username VARCHAR(100),
    sip_password_enc VARCHAR(255),
    webrtc_endpoint VARCHAR(255),
    skillgroup_ids JSON COMMENT '归属技能组ID数组',
    languages VARCHAR(100) COMMENT '语言能力',
    tags JSON COMMENT '专业标签',
    level TINYINT DEFAULT 1 COMMENT '1初级 2中级 3高级 4专家',
    max_concurrent TINYINT DEFAULT 1,
    daily_call_limit INT DEFAULT 200,
    work_time_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 坐席状态日志
CREATE TABLE cc_agent_status_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agent_id BIGINT,
    from_status TINYINT COMMENT '0离线 1就绪 2通话中 3小休 4后处理 5培训 6会议',
    to_status TINYINT,
    duration INT COMMENT '持续秒数',
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通话记录（核心表）
CREATE TABLE cc_call_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    call_id VARCHAR(64) UNIQUE COMMENT '通话唯一ID',
    call_type TINYINT COMMENT '1呼入 2呼出 3内部',
    direction TINYINT COMMENT '1呼入 2呼出',
    caller_number VARCHAR(20) COMMENT '主叫号码',
    callee_number VARCHAR(20) COMMENT '被叫号码',
    caller_display VARCHAR(20) COMMENT '主叫外显号码',
    agent_id BIGINT COMMENT '接听/拨打坐席',
    skillgroup_id BIGINT,
    customer_id BIGINT COMMENT '关联CRM客户',
    lead_id BIGINT COMMENT '关联线索',
    status TINYINT COMMENT '1接通 2未接通 3通话中 4转接 5会议',
    talk_duration INT COMMENT '通话时长秒',
    ring_duration INT COMMENT '响铃时长秒',
    queue_wait_duration INT COMMENT '排队等待秒',
    after_proc_duration INT COMMENT '后处理时长秒',
    recording_url VARCHAR(500),
    recording_size BIGINT,
    recording_encrypt_key VARCHAR(255),
    ivr_flow_id BIGINT,
    ivr_path VARCHAR(500) COMMENT 'IVR经过的路径',
    satisfaction_score TINYINT,
    quality_score INT,
    tags JSON COMMENT '标签数组',
    notes TEXT COMMENT '通话备注',
    hangup_reason VARCHAR(100) COMMENT '挂断原因',
    hangup_by TINYINT COMMENT '1客户 2坐席 3系统',
    sip_call_id VARCHAR(200),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent_time (agent_id, started_at),
    INDEX idx_caller (caller_number),
    INDEX idx_customer (customer_id)
);

-- 通话事件流水
CREATE TABLE cc_call_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    call_id VARCHAR(64),
    event_type VARCHAR(50) COMMENT 'RING/ANSWER/HOLD/RESUME/TRANSFER/MERGE/HANGUP等',
    agent_id BIGINT,
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    detail JSON COMMENT '事件详情',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IVR流程配置
CREATE TABLE cc_ivr_flow (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    flow_config JSON COMMENT '流程图JSON配置（节点和连线）',
    bind_numbers JSON COMMENT '绑定的号码数组',
    work_time_flow_id BIGINT COMMENT '工作时间流程',
    non_work_time_flow_id BIGINT COMMENT '非工作时间流程',
    holiday_config JSON,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 外呼任务
CREATE TABLE cc_outbound_task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    task_type TINYINT COMMENT '1营销 2回访 3通知 4催收 5调研',
    phone_list_count INT DEFAULT 0 COMMENT '号码总数',
    completed_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    dial_mode TINYINT COMMENT '1预览式 2预测式 3自动语音',
    script TEXT COMMENT '外呼话术脚本',
    dial_time_start TIME COMMENT '可拨打开始时间',
    dial_time_end TIME COMMENT '可拨打结束时间',
    max_retry INT DEFAULT 3,
    display_number_id BIGINT,
    concurrent_limit INT DEFAULT 10,
    assigned_skillgroup_id BIGINT,
    status TINYINT COMMENT '0草稿 1执行中 2暂停 3完成 4终止',
    start_date DATE,
    end_date DATE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 外呼号码清单
CREATE TABLE cc_outbound_phone (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT,
    customer_name VARCHAR(100),
    phone VARCHAR(20),
    province VARCHAR(20),
    city VARCHAR(20),
    status TINYINT DEFAULT 0 COMMENT '0待拨打 1拨打中 2已接通 3未接通 4空号 5停机 6拒接 7预约回拨',
    call_count INT DEFAULT 0,
    last_call_time TIMESTAMP,
    talk_duration INT,
    intent_level TINYINT COMMENT '意向等级 A/B/C/D',
    feedback TEXT,
    crm_customer_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 质检记录
CREATE TABLE cc_quality_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    call_id BIGINT,
    recording_id BIGINT,
    check_type TINYINT COMMENT '1自动 2人工',
    service_score INT,
    professional_score INT,
    process_score INT,
    communication_score INT,
    result_score INT,
    total_score INT,
    asr_text TEXT COMMENT '语音转文字',
    emotion_analysis JSON,
    keyword_hits JSON,
    issues TEXT,
    checked_by BIGINT,
    checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
