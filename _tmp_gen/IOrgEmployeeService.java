package com.zhehang.erp.modules.org.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.org.domain.dto.EmployeeDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgEmployee;
import com.zhehang.erp.modules.org.domain.vo.EmployeeVO;

public interface IOrgEmployeeService extends IService<OrgEmployee> {
    IPage<EmployeeVO> selectEmployeePage(int pageNum, int pageSize, String name, Long deptId, Long postId, Integer status);
    EmployeeVO selectEmployeeById(Long id);
    void createEmployee(EmployeeDTO dto);
    void updateEmployee(EmployeeDTO dto);
    void deleteEmployee(Long id);
}
