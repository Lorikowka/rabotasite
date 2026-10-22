$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    Write-Host "Nuzhny prava administratora. Zapustite PowerShell ot imeni administratora." -ForegroundColor Yellow
    exit 1
}

$ruleName = "TeenWork (3000, 4000)"

if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
    Write-Host "Pravilo '$ruleName' uzhe sushchestvuet." -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000, 4000 -Profile Private,Domain -Description "TeenWork: sayt (Next.js) i API dlya dostupa iz lokalnoy seti" | Out-Null
    Write-Host "Sozdano pravilo '$ruleName'." -ForegroundColor Green
}

$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -ExpandProperty IPAddress -Unique

Write-Host ""
Write-Host "Sayt dostupen po adresam:" -ForegroundColor Cyan
foreach ($ip in $ips) {
    Write-Host "  http://$($ip):3000"
}
Write-Host "API dostupen po adresam:"
foreach ($ip in $ips) {
    Write-Host "  http://$($ip):4000"
}
