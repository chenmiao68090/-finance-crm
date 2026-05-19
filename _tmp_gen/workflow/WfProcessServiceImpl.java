package com.zhehang.erp.modules.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhehang.erp.modules.workflow.domain.dto.WfProcessDefDTO;
import com.zhehang.erp.modules.workflow.domain.entity.WfProcessDef;
import com.zhehang.erp.modules.workflow.domain.vo.WfProcessDefVO;
import com.zhehang.erp.modules.workflow.mapper.WfProcessDefMapper;
import com.zhehang.erp.modules.workflow.service.IWfProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WfProcessServiceImpl implements IWfProcessService {

    private final WfProcessDefMapper processDefMapper;

    @Override
    public List<WfProcessDefVO> list(String name, String category, Integer status) {
        LambdaQueryWrapper<WfProcessDef> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(WfProcessDef::getName, name);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(WfProcessDef::getCategory, category);
        }
        if (status != null) {
            wrapper.eq(WfProcessDef::getStatus, status);
        }
        wrapper.orderByDesc(WfProcessDef::getCreateTime);
        List<WfProcessDef> list = processDefMapper.selectList(wrapper);
        return list.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public WfProcessDefVO getById(Long id) {
        WfProcessDef entity = processDefMapper.selectById(id);
        return entity != null ? toVO(entity) : null;
    }

    @Override
    public void createProcessDef(WfProcessDefDTO dto) {
        WfProcessDef entity = new WfProcessDef();
        BeanUtils.copyProperties(dto, entity);
        entity.setVersion(1);
        entity.setStatus(0); // 草稿
        processDefMapper.insert(entity);
    }

    @Override
    public void updateProcessDef(WfProcessDefDTO dto) {
        WfProcessDef entity = processDefMapper.selectById(dto.getId());
        if (entity == null) {
            throw new RuntimeException("流程定义不存在");
        }
        if (entity.getStatus() == 1) {
            throw new RuntimeException("已发布的流程不能直接修改，请停用后再编辑");
        }
        BeanUtils.copyProperties(dto, entity);
        processDefMapper.updateById(entity);
    }

    @Override
    public void publishProcess(Long defId) {
        WfProcessDef entity = processDefMapper.selectById(defId);
        if (entity == null) {
            throw new RuntimeException("流程定义不存在");
        }
        entity.setStatus(1);
        entity.setVersion(entity.getVersion() + 1);
        processDefMapper.updateById(entity);
    }

    @Override
    public void disableProcess(Long defId) {
        WfProcessDef entity = processDefMapper.selectById(defId);
        if (entity == null) {
            throw new RuntimeException("流程定义不存在");
        }
        entity.setStatus(2);
        processDefMapper.updateById(entity);
    }

    @Override
    public List<Map<String, Object>> getTemplates() {
        List<Map<String, Object>> templates = new ArrayList<>();
        templates.add(buildTemplate("leave", "请假审批", "attendance",
                "[{\"field\":\"leaveType\",\"label\":\"请假类型\",\"type\":\"select\",\"options\":[\"事假\",\"病假\",\"年假\",\"调休\"]},{\"field\":\"days\",\"label\":\"请假天数\",\"type\":\"number\"},{\"field\":\"reason\",\"label\":\"请假事由\",\"type\":\"textarea\"}]",
                "{\"nodes\":[{\"id\":\"start\",\"type\":\"start\",\"name\":\"开始\"},{\"id\":\"node1\",\"type\":\"approval\",\"name\":\"部门主管审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"dept_leader\"},{\"id\":\"end\",\"type\":\"end\",\"name\":\"结束\"}],\"edges\":[{\"from\":\"start\",\"to\":\"node1\"},{\"from\":\"node1\",\"to\":\"end\"}]}"));
        templates.add(buildTemplate("expense", "报销审批", "finance",
                "[{\"field\":\"amount\",\"label\":\"报销金额\",\"type\":\"number\"},{\"field\":\"expenseType\",\"label\":\"费用类型\",\"type\":\"select\",\"options\":[\"交通费\",\"餐饮费\",\"住宿费\",\"办公用品\",\"其他\"]},{\"field\":\"description\",\"label\":\"费用说明\",\"type\":\"textarea\"}]",
                "{\"nodes\":[{\"id\":\"start\",\"type\":\"start\",\"name\":\"开始\"},{\"id\":\"node1\",\"type\":\"approval\",\"name\":\"部门主管审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"dept_leader\"},{\"id\":\"condition1\",\"type\":\"condition\",\"name\":\"金额判断\",\"conditions\":[{\"expression\":\"amount > 5000\",\"nextNode\":\"node2\"},{\"expression\":\"amount <= 5000\",\"nextNode\":\"end\"}]},{\"id\":\"node2\",\"type\":\"approval\",\"name\":\"总经理审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"general_manager\"},{\"id\":\"end\",\"type\":\"end\",\"name\":\"结束\"}],\"edges\":[{\"from\":\"start\",\"to\":\"node1\"},{\"from\":\"node1\",\"to\":\"condition1\"},{\"from\":\"condition1\",\"to\":\"node2\"},{\"from\":\"condition1\",\"to\":\"end\"},{\"from\":\"node2\",\"to\":\"end\"}]}"));
        templates.add(buildTemplate("purchase", "采购审批", "supply",
                "[{\"field\":\"item\",\"label\":\"采购物品\",\"type\":\"text\"},{\"field\":\"amount\",\"label\":\"采购金额\",\"type\":\"number\"},{\"field\":\"quantity\",\"label\":\"数量\",\"type\":\"number\"},{\"field\":\"reason\",\"label\":\"采购说明\",\"type\":\"textarea\"}]",
                "{\"nodes\":[{\"id\":\"start\",\"type\":\"start\",\"name\":\"开始\"},{\"id\":\"node1\",\"type\":\"approval\",\"name\":\"部门主管审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"dept_leader\"},{\"id\":\"node2\",\"type\":\"approval\",\"name\":\"采购部审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"purchase_manager\"},{\"id\":\"end\",\"type\":\"end\",\"name\":\"结束\"}],\"edges\":[{\"from\":\"start\",\"to\":\"node1\"},{\"from\":\"node1\",\"to\":\"node2\"},{\"from\":\"node2\",\"to\":\"end\"}]}"));
        templates.add(buildTemplate("seal", "用章审批", "admin",
                "[{\"field\":\"sealType\",\"label\":\"印章类型\",\"type\":\"select\",\"options\":[\"公章\",\"合同章\",\"财务章\",\"法人章\"]},{\"field\":\"usage\",\"label\":\"用途说明\",\"type\":\"textarea\"},{\"field\":\"copies\",\"label\":\"份数\",\"type\":\"number\"}]",
                "{\"nodes\":[{\"id\":\"start\",\"type\":\"start\",\"name\":\"开始\"},{\"id\":\"node1\",\"type\":\"approval\",\"name\":\"部门主管审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"dept_leader\"},{\"id\":\"node2\",\"type\":\"approval\",\"name\":\"行政主管审批\",\"assigneeType\":\"role\",\"assigneeValue\":\"admin_manager\"},{\"id\":\"end\",\"type\":\"end\",\"name\":\"结束\"}],\"edges\":[{\"from\":\"start\",\"to\":\"node1\"},{\"from\":\"node1\",\"to\":\"node2\"},{\"from\":\"node2\",\"to\":\"end\"}]}"));
        return templates;
    }

    private Map<String, Object> buildTemplate(String key, String name, String category, String formConfig, String processConfig) {
        Map<String, Object> tpl = new HashMap<>();
        tpl.put("key", key);
        tpl.put("name", name);
        tpl.put("category", category);
        tpl.put("formConfig", formConfig);
        tpl.put("processConfig", processConfig);
        return tpl;
    }

    private WfProcessDefVO toVO(WfProcessDef entity) {
        WfProcessDefVO vo = new WfProcessDefVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }
}
