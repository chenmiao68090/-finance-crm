package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.crm.domain.entity.CrmContact;
import com.zhehang.erp.modules.crm.domain.entity.CrmCustomer;
import com.zhehang.erp.modules.crm.domain.entity.CrmLead;
import com.zhehang.erp.modules.crm.mapper.CrmContactMapper;
import com.zhehang.erp.modules.crm.mapper.CrmCustomerMapper;
import com.zhehang.erp.modules.crm.mapper.CrmLeadMapper;
import com.zhehang.erp.modules.crm.service.ICrmLeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CrmLeadServiceImpl extends ServiceImpl<CrmLeadMapper, CrmLead> implements ICrmLeadService {

    private final CrmLeadMapper leadMapper;
    private final CrmCustomerMapper customerMapper;
    private final CrmContactMapper contactMapper;

    @Override
    public IPage<CrmLead> selectPage(int pageNum, int pageSize, String name, Integer source, Integer status, Long ownerId) {
        LambdaQueryWrapper<CrmLead> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), CrmLead::getName, name)
               .eq(source != null, CrmLead::getSource, source)
               .eq(status != null, CrmLead::getStatus, status)
               .eq(ownerId != null, CrmLead::getOwnerId, ownerId)
               .orderByDesc(CrmLead::getCreateTime);
        return leadMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void convertToCustomer(Long id) {
        CrmLead lead = leadMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        if (lead.getStatus() == 3) {
            throw new BusinessException("该线索已转化");
        }

        // 创建客户
        CrmCustomer customer = new CrmCustomer();
        customer.setName(lead.getCompany() != null ? lead.getCompany() : lead.getName());
        customer.setSource("线索转化");
        customer.setLevel("C");
        customer.setTaxpayerType(1);
        customer.setStatus(0);
        customer.setOwnerId(lead.getOwnerId());
        customerMapper.insert(customer);

        // 创建联系人
        CrmContact contact = new CrmContact();
        contact.setCustomerId(customer.getId());
        contact.setName(lead.getName());
        contact.setPhone(lead.getPhone());
        contact.setEmail(lead.getEmail());
        contact.setIsPrimary(1);
        contactMapper.insert(contact);

        // 更新线索状态为已转化
        lead.setStatus(3);
        leadMapper.updateById(lead);
    }

    @Override
    public void assignLead(Long id, Long ownerId) {
        CrmLead lead = leadMapper.selectById(id);
        if (lead == null) {
            throw new BusinessException("线索不存在");
        }
        lead.setOwnerId(ownerId);
        leadMapper.updateById(lead);
    }
}
