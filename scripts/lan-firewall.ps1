param([switch]$Remove)
$rule = 'Dubchef LAN Web 5173 (Private only)'
if ($Remove) {
  Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  Write-Host 'Đã gỡ rule Dubchef LAN.'
} else {
  if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 -Profile Private | Out-Null
  }
  Write-Host 'Đã cho phép cổng 5173 trên Wi-Fi Private (không mở API/SQL).'
}
