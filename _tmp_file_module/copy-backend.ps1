$dest = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\file"
$src = "d:\陈苗\_tmp_file_module"

# Create target directories
New-Item -ItemType Directory -Path "$dest\domain\entity" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\mapper" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\service\impl" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\controller" -Force | Out-Null

# Copy entity files
Copy-Item "$src\domain\entity\*.java" "$dest\domain\entity\" -Force

# Copy mapper files
Copy-Item "$src\mapper\*.java" "$dest\mapper\" -Force

# Copy service files
Copy-Item "$src\service\*.java" "$dest\service\" -Force
Copy-Item "$src\service\impl\*.java" "$dest\service\impl\" -Force

# Copy controller files - replace existing placeholder
Copy-Item "$src\controller\*.java" "$dest\controller\" -Force

# Remove old placeholder FileController.java
if (Test-Path "$dest\controller\FileController.java") {
    Remove-Item "$dest\controller\FileController.java" -Force
}

Write-Host "Backend files copied successfully!"
