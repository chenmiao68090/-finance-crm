package com.zhehang.erp.modules.org.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.org.domain.dto.EmployeeDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgEmployee;
import com.zhehang.erp.modules.org.domain.vo.EmployeeVO;
import com.zhehang.erp.modules.org.mapper.OrgEmployeeMapper;
import com.zhehang.erp.modules.org.service.IOrgEmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrgEmployeeServiceImpl extends ServiceImpl<OrgEmployeeMapper, OrgEmployee> implements IOrgEmployeeService {

    private final OrgEmployeeMapper employeeMapper;

    @Override
    public IPage<EmployeeVO> selectEmployeePage(int pageNum, int pageSize, String name, Long deptId, Long postId, Integer status) {
        Page<?> page = new Page<>(pageNum, pageSize);
        return employeeMapper.selectEmployeePage(page, name, deptId, postId, status);
    }

    @Override
    public EmployeeVO selectEmployeeById(Long id) {
        EmployeeVO vo = employeeMapper.selectEmployeeById(id);
        if (vo == null) {
            throw new BusinessException("员工不存在");
        }
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createEmployee(EmployeeDTO dto) {
        // 校验工号唯一
        long count = count(new LambdaQueryWrapper<OrgEmployee>().eq(OrgEmployee::getEmpCode, dto.getEmpCode()));
        if (count > 0) {
            throw new BusinessException("员工工号已存在");
        }
        OrgEmployee employee = new OrgEmployee();
        BeanUtils.copyProperties(dto, employee);
        if (employee.getStatus() == null) {
            employee.setStatus(2); // 默认试用状态
        }
        employeeMapper.insert(employee);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateEmployee(EmployeeDTO dto) {
        OrgEmployee employee = employeeMapper.selectById(dto.getId());
        if (employee == null) {
            throw new BusinessException("员工不存在");
        }
        // 检查工号唯一性（排除自身）
        long count = count(new LambdaQueryWrapper<OrgEmployee>()
                .eq(OrgEmployee::getEmpCode, dto.getEmpCode())
                .ne(OrgEmployee::getId, dto.getId()));
        if (count > 0) {
            throw new BusinessException("员工工号已存在");
        }
        BeanUtils.copyProperties(dto, employee);
        employeeMapper.updateById(employee);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteEmployee(Long id) {
        employeeMapper.deleteById(id);
    }
}
