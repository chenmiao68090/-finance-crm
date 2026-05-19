$gen = "d:\陈苗\_tmp_gen"
$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\crm"
$uiBase = "d:\zhehang-erp\zhehang-erp-ui\src"

# ===== 后端 =====

# 创建目录结构
$dirs = @(
    "$base\domain\entity",
    "$base\mapper",
    "$base\service\impl",
    "$base\controller"
)
foreach ($d in $dirs) {
    if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# Entities
Copy-Item "$gen\CrmLead.java" "$base\domain\entity\CrmLead.java" -Force
Copy-Item "$gen\CrmCustomer.java" "$base\domain\entity\CrmCustomer.java" -Force
Copy-Item "$gen\CrmContact.java" "$base\domain\entity\CrmContact.java" -Force
Copy-Item "$gen\CrmFollow.java" "$base\domain\entity\CrmFollow.java" -Force
Copy-Item "$gen\CrmOpportunity.java" "$base\domain\entity\CrmOpportunity.java" -Force
Copy-Item "$gen\CrmContract.java" "$base\domain\entity\CrmContract.java" -Force
Copy-Item "$gen\CrmTicket.java" "$base\domain\entity\CrmTicket.java" -Force
Copy-Item "$gen\CrmPool.java" "$base\domain\entity\CrmPool.java" -Force

# Mappers
Copy-Item "$gen\CrmLeadMapper.java" "$base\mapper\CrmLeadMapper.java" -Force
Copy-Item "$gen\CrmCustomerMapper.java" "$base\mapper\CrmCustomerMapper.java" -Force
Copy-Item "$gen\CrmContactMapper.java" "$base\mapper\CrmContactMapper.java" -Force
Copy-Item "$gen\CrmFollowMapper.java" "$base\mapper\CrmFollowMapper.java" -Force
Copy-Item "$gen\CrmOpportunityMapper.java" "$base\mapper\CrmOpportunityMapper.java" -Force
Copy-Item "$gen\CrmContractMapper.java" "$base\mapper\CrmContractMapper.java" -Force
Copy-Item "$gen\CrmTicketMapper.java" "$base\mapper\CrmTicketMapper.java" -Force
Copy-Item "$gen\CrmPoolMapper.java" "$base\mapper\CrmPoolMapper.java" -Force

# Service Interfaces
Copy-Item "$gen\ICrmLeadService.java" "$base\service\ICrmLeadService.java" -Force
Copy-Item "$gen\ICrmCustomerService.java" "$base\service\ICrmCustomerService.java" -Force
Copy-Item "$gen\ICrmContactService.java" "$base\service\ICrmContactService.java" -Force
Copy-Item "$gen\ICrmFollowService.java" "$base\service\ICrmFollowService.java" -Force
Copy-Item "$gen\ICrmOpportunityService.java" "$base\service\ICrmOpportunityService.java" -Force
Copy-Item "$gen\ICrmContractService.java" "$base\service\ICrmContractService.java" -Force
Copy-Item "$gen\ICrmTicketService.java" "$base\service\ICrmTicketService.java" -Force
Copy-Item "$gen\ICrmPoolService.java" "$base\service\ICrmPoolService.java" -Force

# Service Implementations
Copy-Item "$gen\CrmLeadServiceImpl.java" "$base\service\impl\CrmLeadServiceImpl.java" -Force
Copy-Item "$gen\CrmCustomerServiceImpl.java" "$base\service\impl\CrmCustomerServiceImpl.java" -Force
Copy-Item "$gen\CrmContactServiceImpl.java" "$base\service\impl\CrmContactServiceImpl.java" -Force
Copy-Item "$gen\CrmFollowServiceImpl.java" "$base\service\impl\CrmFollowServiceImpl.java" -Force
Copy-Item "$gen\CrmOpportunityServiceImpl.java" "$base\service\impl\CrmOpportunityServiceImpl.java" -Force
Copy-Item "$gen\CrmContractServiceImpl.java" "$base\service\impl\CrmContractServiceImpl.java" -Force
Copy-Item "$gen\CrmTicketServiceImpl.java" "$base\service\impl\CrmTicketServiceImpl.java" -Force
Copy-Item "$gen\CrmPoolServiceImpl.java" "$base\service\impl\CrmPoolServiceImpl.java" -Force

# Controllers
Copy-Item "$gen\CrmLeadController.java" "$base\controller\CrmLeadController.java" -Force
Copy-Item "$gen\CrmCustomerController.java" "$base\controller\CrmCustomerController.java" -Force
Copy-Item "$gen\CrmContactController.java" "$base\controller\CrmContactController.java" -Force
Copy-Item "$gen\CrmFollowController.java" "$base\controller\CrmFollowController.java" -Force
Copy-Item "$gen\CrmOpportunityController.java" "$base\controller\CrmOpportunityController.java" -Force
Copy-Item "$gen\CrmContractController.java" "$base\controller\CrmContractController.java" -Force
Copy-Item "$gen\CrmTicketController.java" "$base\controller\CrmTicketController.java" -Force
Copy-Item "$gen\CrmPoolController.java" "$base\controller\CrmPoolController.java" -Force

# ===== 前端 =====

# API
Copy-Item "$gen\crm.ts" "$uiBase\api\crm.ts" -Force

# Vue Pages
Copy-Item "$gen\lead.vue" "$uiBase\views\crm\lead.vue" -Force
Copy-Item "$gen\customer.vue" "$uiBase\views\crm\customer.vue" -Force
Copy-Item "$gen\contact.vue" "$uiBase\views\crm\contact.vue" -Force
Copy-Item "$gen\opportunity.vue" "$uiBase\views\crm\opportunity.vue" -Force
Copy-Item "$gen\contract.vue" "$uiBase\views\crm\contract.vue" -Force

# i18n (需手动合并到已有文件)
Copy-Item "$gen\crm-zh-CN.ts" "$uiBase\locales\crm-zh-CN.ts" -Force
Copy-Item "$gen\crm-en-US.ts" "$uiBase\locales\crm-en-US.ts" -Force

Write-Host "===== CRM Module Deployed Successfully! =====" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: $base" -ForegroundColor Cyan
Write-Host "Frontend: $uiBase\views\crm\" -ForegroundColor Cyan
Write-Host "API: $uiBase\api\crm.ts" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOTE: Please merge crm-zh-CN.ts and crm-en-US.ts into your existing locale files."
