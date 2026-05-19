package com.zhehang.erp.modules.sales.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.sales.domain.entity.SalesReceipt;
import com.zhehang.erp.modules.sales.mapper.SalesReceiptMapper;
import com.zhehang.erp.modules.sales.service.ISalesReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SalesReceiptServiceImpl extends ServiceImpl<SalesReceiptMapper, SalesReceipt> implements ISalesReceiptService {

    private final SalesReceiptMapper receiptMapper;

    @Override
    public IPage<SalesReceipt> selectPage(int pageNum, int pageSize, Long customerId, Integer status, String startDate, String endDate) {
        LambdaQueryWrapper<SalesReceipt> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(customerId != null, SalesReceipt::getCustomerId, customerId)
               .eq(status != null, SalesReceipt::getStatus, status)
               .ge(startDate != null, SalesReceipt::getReceiptDate, startDate)
               .le(endDate != null, SalesReceipt::getReceiptDate, endDate)
               .orderByDesc(SalesReceipt::getCreateTime);
        return receiptMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<SalesReceipt> overdueList() {
        LambdaQueryWrapper<SalesReceipt> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(true, SalesReceipt::getDueDate, LocalDate.now())
               .ne(SalesReceipt::getStatus, 2)
               .orderByAsc(SalesReceipt::getDueDate);
        return receiptMapper.selectList(wrapper);
    }

    @Override
    public Map<String, Object> monthlyStats() {
        LocalDate now = LocalDate.now();
        LocalDate firstDay = now.withDayOfMonth(1);

        // 本月应收
        LambdaQueryWrapper<SalesReceipt> dueWrapper = new LambdaQueryWrapper<>();
        dueWrapper.ge(SalesReceipt::getDueDate, firstDay).le(SalesReceipt::getDueDate, now);
        List<SalesReceipt> dueList = receiptMapper.selectList(dueWrapper);
        BigDecimal totalDue = dueList.stream().map(SalesReceipt::getAmount).filter(a -> a != null).reduce(BigDecimal.ZERO, BigDecimal::add);

        // 本月已收
        LambdaQueryWrapper<SalesReceipt> receivedWrapper = new LambdaQueryWrapper<>();
        receivedWrapper.ge(SalesReceipt::getReceiptDate, firstDay).le(SalesReceipt::getReceiptDate, now).eq(SalesReceipt::getStatus, 2);
        List<SalesReceipt> receivedList = receiptMapper.selectList(receivedWrapper);
        BigDecimal totalReceived = receivedList.stream().map(SalesReceipt::getReceivedAmount).filter(a -> a != null).reduce(BigDecimal.ZERO, BigDecimal::add);

        // 逾期金额
        List<SalesReceipt> overdueList = overdueList();
        BigDecimal overdueAmount = overdueList.stream().map(r -> {
            BigDecimal due = r.getAmount() != null ? r.getAmount() : BigDecimal.ZERO;
            BigDecimal received = r.getReceivedAmount() != null ? r.getReceivedAmount() : BigDecimal.ZERO;
            return due.subtract(received);
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        // 回款率
        BigDecimal rate = totalDue.compareTo(BigDecimal.ZERO) > 0
                ? totalReceived.multiply(new BigDecimal("100")).divide(totalDue, 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDue", totalDue);
        stats.put("totalReceived", totalReceived);
        stats.put("overdueAmount", overdueAmount);
        stats.put("receiptRate", rate);
        return stats;
    }
}
