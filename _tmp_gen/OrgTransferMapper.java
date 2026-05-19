package com.zhehang.erp.modules.org.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhehang.erp.modules.org.domain.entity.OrgTransfer;
import com.zhehang.erp.modules.org.domain.vo.TransferVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface OrgTransferMapper extends BaseMapper<OrgTransfer> {
    /**
     * 分页查询异动记录（关联员工、部门、岗位信息）
     */
    IPage<TransferVO> selectTransferPage(Page<?> page,
                                          @Param("employeeId") Long employeeId,
                                          @Param("transferType") Integer transferType,
                                          @Param("status") Integer status);
}
