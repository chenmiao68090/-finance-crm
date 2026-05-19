$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

$salaryImpl = @'
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmSalary;
import com.zhehang.erp.modules.hrm.mapper.HrmSalaryMapper;
import com.zhehang.erp.modules.hrm.service.IHrmSalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrmSalaryServiceImpl extends ServiceImpl<HrmSalaryMapper, HrmSalary> implements IHrmSalaryService {

    private final HrmSalaryMapper salaryMapper;

    @Override
    public IPage<HrmSalary> selectPage(int pageNum, int pageSize, Long employeeId, String salaryMonth, Integer status) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmSalary::getEmployeeId, employeeId)
               .eq(StringUtils.hasText(salaryMonth), HrmSalary::getSalaryMonth, salaryMonth)
               .eq(status != null, HrmSalary::getStatus, status)
               .orderByDesc(HrmSalary::getSalaryMonth);
        return salaryMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void calculate(String salaryMonth) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmSalary::getSalaryMonth, salaryMonth)
               .eq(HrmSalary::getStatus, 0);
        List<HrmSalary> list = salaryMapper.selectList(wrapper);
        for (HrmSalary salary : list) {
            BigDecimal actual = BigDecimal.ZERO;
            actual = actual.add(salary.getBaseSalary() != null ? salary.getBaseSalary() : BigDecimal.ZERO);
            actual = actual.add(salary.getPerformanceBonus() != null ? salary.getPerformanceBonus() : BigDecimal.ZERO);
            actual = actual.add(salary.getOvertimePay() != null ? salary.getOvertimePay() : BigDecimal.ZERO);
            actual = actual.add(salary.getAllowance() != null ? salary.getAllowance() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getDeduction() != null ? salary.getDeduction() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getSocialInsurance() != null ? salary.getSocialInsurance() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getHousingFund() != null ? salary.getHousingFund() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getTax() != null ? salary.getTax() : BigDecimal.ZERO);
            salary.setActualSalary(actual);
            salary.setStatus(1);
            salaryMapper.updateById(salary);
        }
    }

    @Override
    public void pay(String salaryMonth) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmSalary::getSalaryMonth, salaryMonth)
               .eq(HrmSalary::getStatus, 1);
        List<HrmSalary> list = salaryMapper.selectList(wrapper);
        for (HrmSalary salary : list) {
            salary.setStatus(2);
            salaryMapper.updateById(salary);
        }
    }

    @Override
    public Map<String, Object> paySlip(Long id) {
        HrmSalary salary = salaryMapper.selectById(id);
        if (salary == null) {
            throw new BusinessException("薪资记录不存在");
        }
        Map<String, Object> slip = new HashMap<>();
        slip.put("salary", salary);
        BigDecimal income = (salary.getBaseSalary() != null ? salary.getBaseSalary() : BigDecimal.ZERO)
            .add(salary.getPerformanceBonus() != null ? salary.getPerformanceBonus() : BigDecimal.ZERO)
            .add(salary.getOvertimePay() != null ? salary.getOvertimePay() : BigDecimal.ZERO)
            .add(salary.getAllowance() != null ? salary.getAllowance() : BigDecimal.ZERO);
        slip.put("income", income);
        BigDecimal deductions = (salary.getDeduction() != null ? salary.getDeduction() : BigDecimal.ZERO)
            .add(salary.getSocialInsurance() != null ? salary.getSocialInsurance() : BigDecimal.ZERO)
            .add(salary.getHousingFund() != null ? salary.getHousingFund() : BigDecimal.ZERO)
            .add(salary.getTax() != null ? salary.getTax() : BigDecimal.ZERO);
        slip.put("deductions", deductions);
        return slip;
    }
}
'@
[IO.File]::WriteAllText("$base\service\impl\HrmSalaryServiceImpl.java", $salaryImpl, (New-Object System.Text.UTF8Encoding $false))

$performanceImpl = @'
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmPerformance;
import com.zhehang.erp.modules.hrm.mapper.HrmPerformanceMapper;
import com.zhehang.erp.modules.hrm.service.IHrmPerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrmPerformanceServiceImpl extends ServiceImpl<HrmPerformanceMapper, HrmPerformance> implements IHrmPerformanceService {

    private final HrmPerformanceMapper performanceMapper;

    @Override
    public IPage<HrmPerformance> selectPage(int pageNum, int pageSize, Long employeeId, String period, Integer type, Integer status) {
        LambdaQueryWrapper<HrmPerformance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmPerformance::getEmployeeId, employeeId)
               .eq(StringUtils.hasText(period), HrmPerformance::getPeriod, period)
               .eq(type != null, HrmPerformance::getType, type)
               .eq(status != null, HrmPerformance::getStatus, status)
               .orderByDesc(HrmPerformance::getCreateTime);
        return performanceMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void evaluate(Long id, BigDecimal selfScore, BigDecimal leaderScore, String evaluation) {
        HrmPerformance perf = performanceMapper.selectById(id);
        if (perf == null) {
            throw new BusinessException("绩效记录不存在");
        }
        BigDecimal finalScore = selfScore.multiply(BigDecimal.valueOf(0.3))
                .add(leaderScore.multiply(BigDecimal.valueOf(0.7)))
                .setScale(1, RoundingMode.HALF_UP);
        perf.setScore(finalScore);
        perf.setLeaderEvaluation(evaluation);
        perf.setLevel(calculateLevel(finalScore));
        perf.setStatus(2);
        performanceMapper.updateById(perf);
    }

    private String calculateLevel(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(90)) >= 0) return "A";
        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) return "B";
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0) return "C";
        if (score.compareTo(BigDecimal.valueOf(60)) >= 0) return "D";
        return "E";
    }

    @Override
    public Map<String, Object> statistics(String period, Integer type) {
        LambdaQueryWrapper<HrmPerformance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.hasText(period), HrmPerformance::getPeriod, period)
               .eq(type != null, HrmPerformance::getType, type)
               .eq(HrmPerformance::getStatus, 2);
        List<HrmPerformance> list = performanceMapper.selectList(wrapper);
        int a = 0, b = 0, c = 0, d = 0, e = 0;
        for (HrmPerformance p : list) {
            switch (p.getLevel()) {
                case "A": a++; break;
                case "B": b++; break;
                case "C": c++; break;
                case "D": d++; break;
                case "E": e++; break;
            }
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", list.size());
        stats.put("levelA", a);
        stats.put("levelB", b);
        stats.put("levelC", c);
        stats.put("levelD", d);
        stats.put("levelE", e);
        return stats;
    }
}
'@
[IO.File]::WriteAllText("$base\service\impl\HrmPerformanceServiceImpl.java", $performanceImpl, (New-Object System.Text.UTF8Encoding $false))

$trainingImpl = @'
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmTraining;
import com.zhehang.erp.modules.hrm.mapper.HrmTrainingMapper;
import com.zhehang.erp.modules.hrm.service.IHrmTrainingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class HrmTrainingServiceImpl extends ServiceImpl<HrmTrainingMapper, HrmTraining> implements IHrmTrainingService {

    private final HrmTrainingMapper trainingMapper;

    @Override
    public IPage<HrmTraining> selectPage(int pageNum, int pageSize, String title, Integer status) {
        LambdaQueryWrapper<HrmTraining> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(title), HrmTraining::getTitle, title)
               .eq(status != null, HrmTraining::getStatus, status)
               .orderByDesc(HrmTraining::getCreateTime);
        return trainingMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void enroll(Long trainingId, Long employeeId) {
        HrmTraining training = trainingMapper.selectById(trainingId);
        if (training == null) {
            throw new BusinessException("培训不存在");
        }
        if (training.getStatus() != 1) {
            throw new BusinessException("该培训未开放报名");
        }
    }
}
'@
[IO.File]::WriteAllText("$base\service\impl\HrmTrainingServiceImpl.java", $trainingImpl, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Service impls fixed!"
