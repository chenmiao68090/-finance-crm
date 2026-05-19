package com.zhehang.erp.modules.workflow.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.domain.PageQuery;
import com.zhehang.erp.modules.workflow.domain.vo.WfInstanceVO;
import com.zhehang.erp.modules.workflow.domain.vo.WfTaskVO;

import java.util.Map;

/**
 * 流程实例服务
 */
public interface IWfInstanceService {

    /** 发起流程 */
    void startProcess(String processKey, String title, Map<String, Object> formData);

    /** 审批通过 */
    void approve(Long taskId, String comment);

    /** 审批拒绝 */
    void reject(Long taskId, String comment);

    /** 转交 */
    void transfer(Long taskId, Long targetUserId, String comment);

    /** 撤销 */
    void cancel(Long instanceId);

    /** 流程实例详情 */
    WfInstanceVO getDetail(Long instanceId);

    /** 我的待办 */
    IPage<WfTaskVO> getMyTodo(PageQuery query);

    /** 我的已办 */
    IPage<WfTaskVO> getMyDone(PageQuery query);

    /** 我发起的 */
    IPage<WfInstanceVO> getMyStarted(PageQuery query);
}
