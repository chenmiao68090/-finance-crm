package com.zhehang.erp.modules.org.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.org.domain.dto.EmployeeDTO;
import com.zhehang.erp.modules.org.domain.vo.EmployeeVO;
import com.zhehang.erp.modules.org.service.IOrgEmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/org/employee")
@RequiredArgsConstructor
public class OrgEmployeeController {

    private final IOrgEmployeeService employeeService;

    @GetMapping("/list")
    public R<IPage<EmployeeVO>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long postId,
            @RequestParam(required = false) Integer status) {
        return R.ok(employeeService.selectEmployeePage(pageNum, pageSize, name, deptId, postId, status));
    }

    @GetMapping("/{id}")
    public R<EmployeeVO> getInfo(@PathVariable Long id) {
        return R.ok(employeeService.selectEmployeeById(id));
    }

    @PostMapping
    @Log(module = "员工管理", type = Log.OperationType.INSERT)
    public R<Void> add(@Valid @RequestBody EmployeeDTO dto) {
        employeeService.createEmployee(dto);
        return R.ok();
    }

    @PutMapping
    @Log(module = "员工管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@Valid @RequestBody EmployeeDTO dto) {
        employeeService.updateEmployee(dto);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "员工管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return R.ok();
    }
}
