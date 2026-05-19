$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# Build Chinese strings from Unicode codepoints
$recruit_mgmt = -join @([char]0x62DB, [char]0x8058, [char]0x7BA1, [char]0x7406)      # 招聘管理
$resume_mgmt = -join @([char]0x7B80, [char]0x5386, [char]0x7BA1, [char]0x7406)       # 简历管理
$attend_mgmt = -join @([char]0x8003, [char]0x52E4, [char]0x7BA1, [char]0x7406)       # 考勤管理
$leave_mgmt = -join @([char]0x8BF7, [char]0x5047, [char]0x7BA1, [char]0x7406)        # 请假管理
$salary_mgmt = -join @([char]0x85AA, [char]0x8D44, [char]0x7BA1, [char]0x7406)       # 薪资管理
$perf_mgmt = -join @([char]0x7EE9, [char]0x6548, [char]0x7BA1, [char]0x7406)         # 绩效管理
$train_mgmt = -join @([char]0x57F9, [char]0x8BAD, [char]0x7BA1, [char]0x7406)        # 培训管理

$recruit_not_exist = -join @([char]0x62DB, [char]0x8058, [char]0x9700, [char]0x6C42, [char]0x4E0D, [char]0x5B58, [char]0x5728)  # 招聘需求不存在
$resume_not_exist = -join @([char]0x7B80, [char]0x5386, [char]0x4E0D, [char]0x5B58, [char]0x5728)                                 # 简历不存在
$already_clocked = -join @([char]0x4ECA, [char]0x65E5, [char]0x5DF2, [char]0x6253, [char]0x5361)                                   # 今日已打卡
$clock_in_first = -join @([char]0x8BF7, [char]0x5148, [char]0x4E0A, [char]0x73ED, [char]0x6253, [char]0x5361)                     # 请先上班打卡
$leave_not_exist = -join @([char]0x8BF7, [char]0x5047, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)     # 请假记录不存在
$already_handled = -join @([char]0x8BE5, [char]0x7533, [char]0x8BF7, [char]0x5DF2, [char]0x5904, [char]0x7406)                     # 该申请已处理
$salary_not_exist = -join @([char]0x85AA, [char]0x8D44, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)   # 薪资记录不存在
$perf_not_exist = -join @([char]0x7EE9, [char]0x6548, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)     # 绩效记录不存在
$train_not_exist = -join @([char]0x57F9, [char]0x8BAD, [char]0x4E0D, [char]0x5B58, [char]0x5728)                                   # 培训不存在
$train_not_open = -join @([char]0x8BE5, [char]0x57F9, [char]0x8BAD, [char]0x672A, [char]0x5F00, [char]0x653E, [char]0x62A5, [char]0x540D)  # 该培训未开放报名

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

# HrmRecruitController
$content = @"
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;
import com.zhehang.erp.modules.hrm.service.IHrmRecruitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/recruit")
@RequiredArgsConstructor
public class HrmRecruitController {

    private final IHrmRecruitService recruitService;

    @GetMapping("/list")
    public R<IPage<HrmRecruit>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer status) {
        return R.ok(recruitService.selectPage(pageNum, pageSize, title, deptId, status));
    }

    @GetMapping("/{id}")
    public R<HrmRecruit> getInfo(@PathVariable Long id) {
        return R.ok(recruitService.getById(id));
    }

    @PostMapping
    @Log(module = "$recruit_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmRecruit recruit) {
        recruitService.save(recruit);
        return R.ok();
    }

    @PutMapping
    @Log(module = "$recruit_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmRecruit recruit) {
        recruitService.updateById(recruit);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "$recruit_mgmt", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        recruitService.removeById(id);
        return R.ok();
    }

    @PutMapping("/status")
    @Log(module = "$recruit_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> changeStatus(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Integer status = Integer.valueOf(params.get("status").toString());
        recruitService.changeStatus(id, status);
        return R.ok();
    }
}
"@
[IO.File]::WriteAllText("$base\controller\HrmRecruitController.java", $content, $utf8NoBom)

# HrmRecruitServiceImpl
$content = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;
import com.zhehang.erp.modules.hrm.mapper.HrmRecruitMapper;
import com.zhehang.erp.modules.hrm.service.IHrmRecruitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class HrmRecruitServiceImpl extends ServiceImpl<HrmRecruitMapper, HrmRecruit> implements IHrmRecruitService {

    private final HrmRecruitMapper recruitMapper;

    @Override
    public IPage<HrmRecruit> selectPage(int pageNum, int pageSize, String title, Long deptId, Integer status) {
        LambdaQueryWrapper<HrmRecruit> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(title), HrmRecruit::getTitle, title)
               .eq(deptId != null, HrmRecruit::getDeptId, deptId)
               .eq(status != null, HrmRecruit::getStatus, status)
               .orderByDesc(HrmRecruit::getCreateTime);
        return recruitMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void changeStatus(Long id, Integer status) {
        HrmRecruit recruit = recruitMapper.selectById(id);
        if (recruit == null) {
            throw new BusinessException("$recruit_not_exist");
        }
        recruit.setStatus(status);
        recruitMapper.updateById(recruit);
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmRecruitServiceImpl.java", $content, $utf8NoBom)

Write-Host "Fixed with Unicode codepoints - part 1!"
