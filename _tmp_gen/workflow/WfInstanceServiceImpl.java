package com.zhehang.erp.modules.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhehang.erp.common.core.domain.PageQuery;
import com.zhehang.erp.modules.workflow.domain.entity.WfHistory;
import com.zhehang.erp.modules.workflow.domain.entity.WfInstance;
import com.zhehang.erp.modules.workflow.domain.entity.WfProcessDef;
import com.zhehang.erp.modules.workflow.domain.entity.WfTask;
import com.zhehang.erp.modules.workflow.domain.vo.WfHistoryVO;
import com.zhehang.erp.modules.workflow.domain.vo.WfInstanceVO;
import com.zhehang.erp.modules.workflow.domain.vo.WfTaskVO;
import com.zhehang.erp.modules.workflow.mapper.WfHistoryMapper;
import com.zhehang.erp.modules.workflow.mapper.WfInstanceMapper;
import com.zhehang.erp.modules.workflow.mapper.WfProcessDefMapper;
import com.zhehang.erp.modules.workflow.mapper.WfTaskMapper;
import com.zhehang.erp.modules.workflow.service.IWfInstanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WfInstanceServiceImpl implements IWfInstanceService {

    private final WfProcessDefMapper processDefMapper;
    private final WfInstanceMapper instanceMapper;
    private final WfTaskMapper taskMapper;
    private final WfHistoryMapper historyMapper;
    private final ObjectMapper objectMapper;

    // 模拟当前用户ID（实际项目从SecurityContext获取）
    private Long getCurrentUserId() {
        return 1L;
    }

    @Override
    @Transactional
    public void startProcess(String processKey, String title, Map<String, Object> formData) {
        // 查找已发布的流程定义
        LambdaQueryWrapper<WfProcessDef> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WfProcessDef::getProcessKey, processKey)
                .eq(WfProcessDef::getStatus, 1)
                .orderByDesc(WfProcessDef::getVersion)
                .last("LIMIT 1");
        WfProcessDef processDef = processDefMapper.selectOne(wrapper);
        if (processDef == null) {
            throw new RuntimeException("未找到已发布的流程定义: " + processKey);
        }

        // 创建流程实例
        WfInstance instance = new WfInstance();
        instance.setProcessDefId(processDef.getId());
        instance.setTitle(title);
        instance.setInitiatorId(getCurrentUserId());
        instance.setFormData(toJson(formData));
        instance.setStatus(0); // 进行中
        instance.setStartTime(LocalDateTime.now());
        instanceMapper.insert(instance);

        // 解析流程配置，找到第一个审批节点
        Map<String, Object> processConfig = parseJson(processDef.getProcessConfig());
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) processConfig.get("nodes");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) processConfig.get("edges");

        // 从start节点开始找下一个节点
        String nextNodeId = findNextNodeId("start", edges);
        Map<String, Object> nextNode = findNodeById(nextNodeId, nodes);

        // 处理下一节点（可能是条件节点需要自动判断）
        processNode(instance, nextNode, nodes, edges, formData);

        // 记录历史 - 发起
        recordHistory(instance.getId(), "开始", getCurrentUserId(), "start", null);
    }

    @Override
    @Transactional
    public void approve(Long taskId, String comment) {
        WfTask task = taskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            throw new RuntimeException("任务不存在或已处理");
        }

        // 更新任务状态
        task.setStatus(1); // 已通过
        task.setComment(comment);
        task.setHandleTime(LocalDateTime.now());
        taskMapper.updateById(task);

        // 记录历史
        recordHistory(task.getInstanceId(), task.getNodeName(), getCurrentUserId(), "approve", comment);

        // 查找流程实例和定义
        WfInstance instance = instanceMapper.selectById(task.getInstanceId());
        WfProcessDef processDef = processDefMapper.selectById(instance.getProcessDefId());
        Map<String, Object> processConfig = parseJson(processDef.getProcessConfig());
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) processConfig.get("nodes");
        List<Map<String, Object>> edges = (List<Map<String, Object>>) processConfig.get("edges");

        // 获取当前节点ID
        String currentNodeId = findNodeIdByName(task.getNodeName(), nodes);
        String nextNodeId = findNextNodeId(currentNodeId, edges);

        if (nextNodeId == null) {
            // 没有下一个节点，流程结束
            completeInstance(instance);
            return;
        }

        Map<String, Object> nextNode = findNodeById(nextNodeId, nodes);
        if (nextNode == null) {
            completeInstance(instance);
            return;
        }

        // 解析表单数据用于条件判断
        Map<String, Object> formData = parseJson(instance.getFormData());
        processNode(instance, nextNode, nodes, edges, formData);
    }

    @Override
    @Transactional
    public void reject(Long taskId, String comment) {
        WfTask task = taskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            throw new RuntimeException("任务不存在或已处理");
        }

        task.setStatus(2); // 已拒绝
        task.setComment(comment);
        task.setHandleTime(LocalDateTime.now());
        taskMapper.updateById(task);

        // 更新实例为已拒绝
        WfInstance instance = instanceMapper.selectById(task.getInstanceId());
        instance.setStatus(2); // 已拒绝
        instance.setEndTime(LocalDateTime.now());
        instanceMapper.updateById(instance);

        recordHistory(task.getInstanceId(), task.getNodeName(), getCurrentUserId(), "reject", comment);
    }

    @Override
    @Transactional
    public void transfer(Long taskId, Long targetUserId, String comment) {
        WfTask task = taskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            throw new RuntimeException("任务不存在或已处理");
        }

        // 标记当前任务为已转交
        task.setStatus(3);
        task.setComment(comment);
        task.setHandleTime(LocalDateTime.now());
        taskMapper.updateById(task);

        // 创建新任务给目标用户
        WfTask newTask = new WfTask();
        newTask.setInstanceId(task.getInstanceId());
        newTask.setNodeName(task.getNodeName());
        newTask.setNodeType(task.getNodeType());
        newTask.setAssigneeId(targetUserId);
        newTask.setStatus(0);
        taskMapper.insert(newTask);

        recordHistory(task.getInstanceId(), task.getNodeName(), getCurrentUserId(), "transfer", comment);
    }

    @Override
    @Transactional
    public void cancel(Long instanceId) {
        WfInstance instance = instanceMapper.selectById(instanceId);
        if (instance == null) {
            throw new RuntimeException("流程实例不存在");
        }
        if (!instance.getInitiatorId().equals(getCurrentUserId())) {
            throw new RuntimeException("只有发起人可以撤销流程");
        }
        if (instance.getStatus() != 0) {
            throw new RuntimeException("只能撤销进行中的流程");
        }

        instance.setStatus(3); // 已撤销
        instance.setEndTime(LocalDateTime.now());
        instanceMapper.updateById(instance);

        // 取消所有待处理的任务
        LambdaQueryWrapper<WfTask> taskWrapper = new LambdaQueryWrapper<>();
        taskWrapper.eq(WfTask::getInstanceId, instanceId).eq(WfTask::getStatus, 0);
        List<WfTask> pendingTasks = taskMapper.selectList(taskWrapper);
        for (WfTask t : pendingTasks) {
            t.setStatus(2); // 标记为已拒绝
            t.setHandleTime(LocalDateTime.now());
            taskMapper.updateById(t);
        }

        recordHistory(instanceId, "撤销", getCurrentUserId(), "cancel", null);
    }

    @Override
    public WfInstanceVO getDetail(Long instanceId) {
        WfInstance instance = instanceMapper.selectById(instanceId);
        if (instance == null) {
            return null;
        }

        WfInstanceVO vo = new WfInstanceVO();
        BeanUtils.copyProperties(instance, vo);

        // 获取流程名称
        WfProcessDef def = processDefMapper.selectById(instance.getProcessDefId());
        if (def != null) {
            vo.setProcessName(def.getName());
        }

        // 获取当前待办任务节点
        LambdaQueryWrapper<WfTask> taskWrapper = new LambdaQueryWrapper<>();
        taskWrapper.eq(WfTask::getInstanceId, instanceId).eq(WfTask::getStatus, 0);
        List<WfTask> pendingTasks = taskMapper.selectList(taskWrapper);
        if (!pendingTasks.isEmpty()) {
            WfTask current = pendingTasks.get(0);
            vo.setCurrentNodeName(current.getNodeName());
        }

        // 获取审批历史
        LambdaQueryWrapper<WfHistory> histWrapper = new LambdaQueryWrapper<>();
        histWrapper.eq(WfHistory::getInstanceId, instanceId).orderByAsc(WfHistory::getOperTime);
        List<WfHistory> histories = historyMapper.selectList(histWrapper);
        vo.setHistories(histories.stream().map(h -> {
            WfHistoryVO hv = new WfHistoryVO();
            BeanUtils.copyProperties(h, hv);
            return hv;
        }).collect(Collectors.toList()));

        return vo;
    }

    @Override
    public IPage<WfTaskVO> getMyTodo(PageQuery query) {
        Page<WfTaskVO> page = new Page<>(query.getPageNum(), query.getPageSize());
        return taskMapper.selectTodoPage(page, getCurrentUserId());
    }

    @Override
    public IPage<WfTaskVO> getMyDone(PageQuery query) {
        Page<WfTaskVO> page = new Page<>(query.getPageNum(), query.getPageSize());
        return taskMapper.selectDonePage(page, getCurrentUserId());
    }

    @Override
    public IPage<WfInstanceVO> getMyStarted(PageQuery query) {
        Page<WfInstance> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<WfInstance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WfInstance::getInitiatorId, getCurrentUserId())
                .orderByDesc(WfInstance::getStartTime);
        IPage<WfInstance> result = instanceMapper.selectPage(page, wrapper);

        Page<WfInstanceVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(inst -> {
            WfInstanceVO vo = new WfInstanceVO();
            BeanUtils.copyProperties(inst, vo);
            // 获取流程名称
            WfProcessDef def = processDefMapper.selectById(inst.getProcessDefId());
            if (def != null) {
                vo.setProcessName(def.getName());
            }
            return vo;
        }).collect(Collectors.toList()));
        return voPage;
    }

    // ============= 流程引擎核心方法 =============

    private void processNode(WfInstance instance, Map<String, Object> node,
                             List<Map<String, Object>> nodes, List<Map<String, Object>> edges,
                             Map<String, Object> formData) {
        if (node == null) {
            completeInstance(instance);
            return;
        }

        String type = (String) node.get("type");
        switch (type) {
            case "approval":
                createTask(instance, node);
                break;
            case "condition":
                handleConditionNode(instance, node, nodes, edges, formData);
                break;
            case "end":
                completeInstance(instance);
                break;
            default:
                // 对于未知类型，尝试继续到下一个节点
                String nodeId = (String) node.get("id");
                String nextId = findNextNodeId(nodeId, edges);
                if (nextId != null) {
                    Map<String, Object> nextNode = findNodeById(nextId, nodes);
                    processNode(instance, nextNode, nodes, edges, formData);
                } else {
                    completeInstance(instance);
                }
                break;
        }
    }

    private void createTask(WfInstance instance, Map<String, Object> node) {
        WfTask task = new WfTask();
        task.setInstanceId(instance.getId());
        task.setNodeName((String) node.get("name"));
        task.setNodeType((String) node.get("type"));
        task.setStatus(0); // 待处理

        // 解析审批人
        String assigneeType = (String) node.get("assigneeType");
        String assigneeValue = (String) node.get("assigneeValue");
        Long assigneeId = resolveAssignee(assigneeType, assigneeValue);
        task.setAssigneeId(assigneeId);

        taskMapper.insert(task);
    }

    private Long resolveAssignee(String assigneeType, String assigneeValue) {
        // 简化实现：实际项目中应根据角色/部门查询对应用户
        if ("user".equals(assigneeType)) {
            return Long.parseLong(assigneeValue);
        }
        // role / dept_leader 等类型 - 简化返回管理员ID
        // 实际项目中应查询角色对应的用户
        return 1L;
    }

    private void handleConditionNode(WfInstance instance, Map<String, Object> condNode,
                                     List<Map<String, Object>> nodes, List<Map<String, Object>> edges,
                                     Map<String, Object> formData) {
        List<Map<String, Object>> conditions = (List<Map<String, Object>>) condNode.get("conditions");
        if (conditions == null || conditions.isEmpty()) {
            // 没有条件，走默认路径
            String nodeId = (String) condNode.get("id");
            String nextId = findNextNodeId(nodeId, edges);
            Map<String, Object> nextNode = findNodeById(nextId, nodes);
            processNode(instance, nextNode, nodes, edges, formData);
            return;
        }

        for (Map<String, Object> cond : conditions) {
            String expression = (String) cond.get("expression");
            String nextNodeId = (String) cond.get("nextNode");
            if (evaluateCondition(expression, formData)) {
                Map<String, Object> nextNode = findNodeById(nextNodeId, nodes);
                processNode(instance, nextNode, nodes, edges, formData);
                return;
            }
        }

        // 所有条件都不满足，走最后一个条件的路径
        String lastNextNode = (String) conditions.get(conditions.size() - 1).get("nextNode");
        Map<String, Object> nextNode = findNodeById(lastNextNode, nodes);
        processNode(instance, nextNode, nodes, edges, formData);
    }

    private boolean evaluateCondition(String expression, Map<String, Object> formData) {
        // 简易条件表达式解析器
        // 支持格式: "field > value", "field <= value", "field == value"
        try {
            String[] operators = {">=", "<=", "!=", ">", "<", "=="};
            for (String op : operators) {
                if (expression.contains(op)) {
                    String[] parts = expression.split(op.replace(">", "\\>").replace("<", "\\<"));
                    if (parts.length == 2) {
                        String field = parts[0].trim();
                        String valueStr = parts[1].trim();
                        Object fieldValue = formData.get(field);
                        if (fieldValue == null) return false;

                        double leftVal = Double.parseDouble(fieldValue.toString());
                        double rightVal = Double.parseDouble(valueStr);

                        switch (op) {
                            case ">": return leftVal > rightVal;
                            case "<": return leftVal < rightVal;
                            case ">=": return leftVal >= rightVal;
                            case "<=": return leftVal <= rightVal;
                            case "==": return leftVal == rightVal;
                            case "!=": return leftVal != rightVal;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("条件表达式解析失败: {}", expression, e);
        }
        return false;
    }

    private void completeInstance(WfInstance instance) {
        instance.setStatus(1); // 已完成
        instance.setEndTime(LocalDateTime.now());
        instanceMapper.updateById(instance);
    }

    private void recordHistory(Long instanceId, String nodeName, Long operatorId, String action, String comment) {
        WfHistory history = new WfHistory();
        history.setInstanceId(instanceId);
        history.setNodeName(nodeName);
        history.setOperatorId(operatorId);
        history.setAction(action);
        history.setComment(comment);
        history.setOperTime(LocalDateTime.now());
        historyMapper.insert(history);
    }

    // ============= 工具方法 =============

    private String findNextNodeId(String currentNodeId, List<Map<String, Object>> edges) {
        for (Map<String, Object> edge : edges) {
            if (currentNodeId.equals(edge.get("from"))) {
                return (String) edge.get("to");
            }
        }
        return null;
    }

    private Map<String, Object> findNodeById(String nodeId, List<Map<String, Object>> nodes) {
        if (nodeId == null) return null;
        for (Map<String, Object> node : nodes) {
            if (nodeId.equals(node.get("id"))) {
                return node;
            }
        }
        return null;
    }

    private String findNodeIdByName(String nodeName, List<Map<String, Object>> nodes) {
        for (Map<String, Object> node : nodes) {
            if (nodeName.equals(node.get("name"))) {
                return (String) node.get("id");
            }
        }
        return null;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON序列化失败", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        try {
            if (json == null || json.isEmpty()) return new HashMap<>();
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("JSON解析失败", e);
        }
    }
}
