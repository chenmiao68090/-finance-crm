package com.zhehang.erp.modules.org.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhehang.erp.modules.org.domain.entity.OrgEmployee;
import com.zhehang.erp.modules.org.domain.vo.EmployeeVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OrgEmployeeMapper extends BaseMapper<OrgEmployee> {
    /**
     * 分页查询员工列表（关联部门、岗位）
     */
    IPage<EmployeeVO> selectEmployeePage(Page<?> page,
                                          @Param("name") String name,
                                          @Param("deptId") Long deptId,
                                          @Param("postId") Long postId,
                                          @Param("status") Integer status);

    /**
     * 查询员工详情（关联部门、岗位）
     */
    EmployeeVO selectEmployeeById(@Param("id") Long id);

    /**
     * 统计某部门下的员工人数
     */
    int countByDeptId(@Param("deptId") Long deptId);
}
