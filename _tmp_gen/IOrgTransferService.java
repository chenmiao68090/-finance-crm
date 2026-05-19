package com.zhehang.erp.modules.org.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.org.domain.dto.TransferDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgTransfer;
import com.zhehang.erp.modules.org.domain.vo.TransferVO;

public interface IOrgTransferService extends IService<OrgTransfer> {
    IPage<TransferVO> selectTransferPage(int pageNum, int pageSize, Long employeeId, Integer transferType, Integer status);
    void createTransfer(TransferDTO dto);
    void approveTransfer(Long id, Integer status, Long approverId);
}
