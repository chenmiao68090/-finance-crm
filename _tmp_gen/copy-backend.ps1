$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules"
$gen = "d:\陈苗\_tmp_gen"

# Entities
Copy-Item "$gen\OrgPost.java" "$base\org\domain\entity\OrgPost.java" -Force
Copy-Item "$gen\OrgEmployee.java" "$base\org\domain\entity\OrgEmployee.java" -Force
Copy-Item "$gen\OrgTransfer.java" "$base\org\domain\entity\OrgTransfer.java" -Force

# DTOs
Copy-Item "$gen\PostDTO.java" "$base\org\domain\dto\PostDTO.java" -Force
Copy-Item "$gen\EmployeeDTO.java" "$base\org\domain\dto\EmployeeDTO.java" -Force
Copy-Item "$gen\TransferDTO.java" "$base\org\domain\dto\TransferDTO.java" -Force

# VOs
Copy-Item "$gen\PostVO.java" "$base\org\domain\vo\PostVO.java" -Force
Copy-Item "$gen\EmployeeVO.java" "$base\org\domain\vo\EmployeeVO.java" -Force
Copy-Item "$gen\TransferVO.java" "$base\org\domain\vo\TransferVO.java" -Force
Copy-Item "$gen\OrgTreeVO.java" "$base\org\domain\vo\OrgTreeVO.java" -Force

# Mappers
Copy-Item "$gen\OrgPostMapper.java" "$base\org\mapper\OrgPostMapper.java" -Force
Copy-Item "$gen\OrgEmployeeMapper.java" "$base\org\mapper\OrgEmployeeMapper.java" -Force
Copy-Item "$gen\OrgTransferMapper.java" "$base\org\mapper\OrgTransferMapper.java" -Force
Copy-Item "$gen\SysDeptMapper.java" "$base\system\mapper\SysDeptMapper.java" -Force

# Mapper XMLs
$xmlBase = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\resources\mapper\org"
Copy-Item "$gen\OrgPostMapper.xml" "$xmlBase\OrgPostMapper.xml" -Force
Copy-Item "$gen\OrgEmployeeMapper.xml" "$xmlBase\OrgEmployeeMapper.xml" -Force
Copy-Item "$gen\OrgTransferMapper.xml" "$xmlBase\OrgTransferMapper.xml" -Force

# Services
Copy-Item "$gen\IOrgPostService.java" "$base\org\service\IOrgPostService.java" -Force
Copy-Item "$gen\IOrgEmployeeService.java" "$base\org\service\IOrgEmployeeService.java" -Force
Copy-Item "$gen\IOrgTransferService.java" "$base\org\service\IOrgTransferService.java" -Force
Copy-Item "$gen\IOrgStructureService.java" "$base\org\service\IOrgStructureService.java" -Force

# Service Impls
Copy-Item "$gen\OrgPostServiceImpl.java" "$base\org\service\impl\OrgPostServiceImpl.java" -Force
Copy-Item "$gen\OrgEmployeeServiceImpl.java" "$base\org\service\impl\OrgEmployeeServiceImpl.java" -Force
Copy-Item "$gen\OrgTransferServiceImpl.java" "$base\org\service\impl\OrgTransferServiceImpl.java" -Force
Copy-Item "$gen\OrgStructureServiceImpl.java" "$base\org\service\impl\OrgStructureServiceImpl.java" -Force

# Controllers
Copy-Item "$gen\OrgDeptController.java" "$base\org\controller\OrgDeptController.java" -Force
Copy-Item "$gen\OrgPostController.java" "$base\org\controller\OrgPostController.java" -Force
Copy-Item "$gen\OrgEmployeeController.java" "$base\org\controller\OrgEmployeeController.java" -Force
Copy-Item "$gen\OrgTransferController.java" "$base\org\controller\OrgTransferController.java" -Force
Copy-Item "$gen\OrgStructureController.java" "$base\org\controller\OrgStructureController.java" -Force

Write-Host "All backend files copied successfully!"
