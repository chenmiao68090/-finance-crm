package com.zhehang.erp.modules.workflow.service;

import com.zhehang.erp.modules.workflow.domain.dto.WfProcessDefDTO;
import com.zhehang.erp.modules.workflow.domain.vo.WfProcessDefVO;

import java.util.List;
import java.util.Map;

/**
 * 流程定义服务
 */
public interface IWfProcessService {

    /** 流程定义列表 */
    List<WfProcessDefVO> list(String name, String category, Integer status);

    /** 流程定义详情 */
    WfProcessDefVO getById(Long id);

    /** 创建流程 */
    void createProcessDef(WfProcessDefDTO dto);

    /** 修改流程 */
    void updateProcessDef(WfProcessDefDTO dto);

    /** 发布流程（version+1） */
    void publishProcess(Long defId);

    /** 停用流程 */
    void disableProcess(Long defId);

    /** 获取预设模板列表 */
    List<Map<String, Object>> getTemplates();
}
