package com.zhehang.erp.modules.workflow.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhehang.erp.modules.workflow.domain.entity.WfTask;
import com.zhehang.erp.modules.workflow.domain.vo.WfTaskVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WfTaskMapper extends BaseMapper<WfTask> {

    /**
     * 查询我的待办列表
     */
    IPage<WfTaskVO> selectTodoPage(Page<WfTaskVO> page, @Param("assigneeId") Long assigneeId);

    /**
     * 查询我的已办列表
     */
    IPage<WfTaskVO> selectDonePage(Page<WfTaskVO> page, @Param("assigneeId") Long assigneeId);
}
