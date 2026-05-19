package com.zhehang.erp.modules.org.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.org.domain.dto.TransferDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgEmployee;
import com.zhehang.erp.modules.org.domain.entity.OrgTransfer;
import com.zhehang.erp.modules.org.domain.vo.TransferVO;
import com.zhehang.erp.modules.org.mapper.OrgEmployeeMapper;
import com.zhehang.erp.modules.org.mapper.OrgTransferMapper;
import com.zhehang.erp.modules.org.service.IOrgTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrgTransferServiceImpl extends ServiceImpl<OrgTransferMapper, OrgTransfer> implements IOrgTransferService {

    private final OrgTransferMapper transferMapper;
    private final OrgEmployeeMapper employeeMapper;

    @Override
    public IPage<TransferVO> selectTransferPage(int pageNum, int pageSize, Long employeeId, Integer transferType, Integer status) {
        Page<?> page = new Page<>(pageNum, pageSize);
        return transferMapper.selectTransferPage(page, employeeId, transferType, status);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createTransfer(TransferDTO dto) {
        OrgEmployee employee = employeeMapper.selectById(dto.getEmployeeId());
        if (employee == null) {
            throw new BusinessException("员工不存在");
        }
        OrgTransfer transfer = new OrgTransfer();
        BeanUtils.copyProperties(dto, transfer);
        transfer.setStatus(0); // 待审批
        // 自动填充原部门/岗位
        if (transfer.getFromDeptId() == null) {
            transfer.setFromDeptId(employee.getDeptId());
        }
        if (transfer.getFromPostId() == null) {
            transfer.setFromPostId(employee.getPostId());
        }
        transferMapper.insert(transfer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approveTransfer(Long id, Integer status, Long approverId) {
        OrgTransfer transfer = transferMapper.selectById(id);
        if (transfer == null) {
            throw new BusinessException("异动记录不存在");
        }
        if (transfer.getStatus() != 0) {
            throw new BusinessException("该异动记录已审批");
        }
        transfer.setStatus(status);
        transfer.setApproverId(approverId);
        transferMapper.updateById(transfer);

        // 审批通过，更新员工信息
        if (status == 1) {
            OrgEmployee employee = employeeMapper.selectById(transfer.getEmployeeId());
            if (employee != null) {
                switch (transfer.getTransferType()) {
                    case 2: // 转正
                        employee.setStatus(1);
                        employee.setRegularDate(transfer.getEffectiveDate());
                        break;
                    case 3: // 调岗
                    case 4: // 晋升
                        if (transfer.getToDeptId() != null) {
                            employee.setDeptId(transfer.getToDeptId());
                        }
                        if (transfer.getToPostId() != null) {
                            employee.setPostId(transfer.getToPostId());
                        }
                        break;
                    case 5: // 离职
                        employee.setStatus(3);
                        break;
                    default:
                        break;
                }
                employeeMapper.updateById(employee);
            }
        }
    }
}
