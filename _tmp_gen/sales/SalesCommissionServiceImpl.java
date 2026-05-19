package com.zhehang.erp.modules.sales.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.sales.domain.entity.SalesCommission;
import com.zhehang.erp.modules.sales.domain.entity.SalesOrder;
import com.zhehang.erp.modules.sales.mapper.SalesCommissionMapper;
import com.zhehang.erp.modules.sales.mapper.SalesOrderMapper;
import com.zhehang.erp.modules.sales.service.ISalesCommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SalesCommissionServiceImpl extends ServiceImpl<SalesCommissionMapper, SalesCommission> implements ISalesCommissionService {

    private final SalesCommissionMapper commissionMapper;
    private final SalesOrderMapper orderMapper;

    @Override
    public IPage<SalesCommission> selectPage(int pageNum, int pageSize, Long employeeId, String period, Integer status) {
        LambdaQueryWrapper<SalesCommission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, SalesCommission::getEmployeeId, employeeId)
               .eq(StringUtils.hasText(period), SalesCommission::getPeriod, period)
               .eq(status != null, SalesCommission::getStatus, status)
               .orderByDesc(SalesCommission::getCreateTime);
        return commissionMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void calculate(Long orderId) {
        SalesOrder order = orderMapper.selectById(orderId);
        if (order == null) return;

        // 查找该订单是否已有提成记录
        LambdaQueryWrapper<SalesCommission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SalesCommission::getOrderId, orderId);
        List<SalesCommission> existing = commissionMapper.selectList(wrapper);

        for (SalesCommission commission : existing) {
            BigDecimal commissionAmount = commission.getAmount()
                    .multiply(commission.getCommissionRate())
                    .divide(new BigDecimal("100"), 2, BigDecimal.ROUND_HALF_UP);
            commission.setCommissionAmount(commissionAmount);
            commission.setPeriod(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
            commissionMapper.updateById(commission);
        }
    }

    @Override
    public Map<String, Object> statistics(String period) {
        LambdaQueryWrapper<SalesCommission> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(period)) {
            wrapper.eq(SalesCommission::getPeriod, period);
        }
        List<SalesCommission> list = commissionMapper.selectList(wrapper);

        BigDecimal totalCommission = list.stream()
                .map(SalesCommission::getCommissionAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = list.stream()
                .map(SalesCommission::getAmount)
                .filter(a -> a != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCommission", totalCommission);
        stats.put("totalAmount", totalAmount);
        stats.put("count", list.size());
        return stats;
    }
}
