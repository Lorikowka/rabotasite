# Содержимое файла сохранено в UTF-8 без BOM
# Убеждаемся, что скрипт работает корректно в PowerShell

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    Write-Host 'Нужны права администратора. Запустите PowerShell от имени администратора.' -ForegroundColor Yellow
    exit 1
}

$ruleName = 'TeenWork (3000, 4000)'

if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
    Write-Host "Правило '$ruleName' уже существует." -ForegroundColor Green
}
else {
    New-NetFirewallRule `
        -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 3000, 4000 `
        -Profile Private, Domain `
        -Description 'TeenWork: сайт (Next.js) и API для доступа из локальной сети' | Out-Null
    Write-Host "Создано правило '$ruleName'." -ForegroundColor Green
}

$ips = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' } |
    Select-Object -ExpandProperty IPAddress -Unique

Write-Host ''
Write-Host 'Сайт доступен по адресам:' -ForegroundColor Cyan
foreach ($ip in $ips) {
    Write-Host "  http://$($ip):3000"
}
Write-Host 'API доступен по адресам:'
foreach ($ip in $ips) {
    Write-Host "  http://$($ip):4000"
}
