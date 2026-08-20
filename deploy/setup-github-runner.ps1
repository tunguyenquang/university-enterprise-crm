# ==========================================
# CÀI GITHUB ACTIONS SELF-HOSTED RUNNER TRÊN VPS .174
# ==========================================
# Chạy MỘT LẦN để bật CD tự động. Sau khi cài, mỗi lần push vào main (và CI xanh)
# thì workflow .github/workflows/cd.yml sẽ tự deploy lên https://hustcrm.jvs.com.vn
#
# Vì sao cần runner: .174 chỉ có IP nội bộ (192.168.59.174) nên GitHub Actions trên
# cloud KHÔNG SSH vào được. Runner cài tại chỗ sẽ tự "kéo" job về qua HTTPS outbound
# — không phải mở port, không phải cấp IP public, không lưu SSH key trên GitHub.
#
# CÁCH DÙNG (chạy TỪ MÁY LOCAL, đã có ssh alias jvsadm-174):
#
#   1. Lấy token đăng ký runner (hết hạn sau 1 giờ):
#      Mở https://github.com/tunguyenquang/university-enterprise-crm/settings/actions/runners/new
#      → chọn Windows x64 → copy giá trị token ở dòng `--token ...`
#
#   2. Chạy:
#      $env:GH_RUNNER_TOKEN = '<token vừa copy>'
#      powershell -NoProfile -File deploy/setup-github-runner.ps1
#
#   3. Kiểm tra: runner "hustcrm-174" hiện trạng thái Idle ở trang Runners.
#
# Gỡ runner: powershell -NoProfile -File deploy/setup-github-runner.ps1 -Uninstall
#   (cần $env:GH_RUNNER_TOKEN mới, lấy ở nút Remove trên trang Runners)

param(
    [string]$RepoUrl = 'https://github.com/tunguyenquang/university-enterprise-crm',
    [string]$RunnerName = 'hustcrm-174',
    # Nhãn để cd.yml chọn đúng máy này (runs-on: [self-hosted, windows, hustcrm]).
    [string]$Labels = 'self-hosted,windows,hustcrm',
    [string]$RunnerVersion = '2.328.0',
    [string]$InstallDir = 'C:\apps\actions-runner',
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$SshHost = 'jvsadm-174'

function Info($m) { Write-Host "[runner] $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "[runner] LOI: $m" -ForegroundColor Red; exit 1 }

if (-not $env:GH_RUNNER_TOKEN) {
    Fail @'
Chua set $env:GH_RUNNER_TOKEN.
Lay token tai: <RepoUrl>/settings/actions/runners/new  (chon Windows x64, copy phan sau --token)
Roi chay:  $env:GH_RUNNER_TOKEN = '<token>'
'@
}
$token = $env:GH_RUNNER_TOKEN

# Chay lenh tren server. OpenSSH in banner ra stderr; voi ErrorActionPreference='Stop'
# thi "2>&1" se lam PowerShell 5.1 nem loi du ssh thanh cong -> tam ha xuong 'Continue'.
function Remote($psCommand) {
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($psCommand))
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = & ssh.exe $SshHost "powershell -NonInteractive -EncodedCommand $encoded" 2>$null
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($null -eq $out) { return '' }
    $clean = $out | Where-Object { "$_" -notmatch 'WARNING|store now|openssh\.com|may need to be upgraded' }
    return (($clean | ForEach-Object { "$_" }) -join "`n")
}

# ---------- GỠ RUNNER ----------
if ($Uninstall) {
    Info "Go runner '$RunnerName' khoi server..."
    $out = Remote @"
Set-Location '$InstallDir'
.\config.cmd remove --token $token
"@
    Info $out
    Info 'Da go. Thu muc runner van con o $InstallDir (xoa tay neu muon).'
    exit 0
}

# ---------- KIỂM TRA TRẠNG THÁI HIỆN TẠI ----------
Info 'Kiem tra trang thai tren server...'
$check = Remote @"
`$r = [ordered]@{}
`$r['installed'] = Test-Path '$InstallDir\config.cmd'
`$r['svc'] = [bool](Get-Service | Where-Object { `$_.Name -like '*actions.runner*' })
`$r['nssm'] = Test-Path 'C:\apps\tools\nssm.exe'
`$r['node'] = Test-Path 'C:\Program Files\nodejs\node.exe'
`$r['appdir'] = Test-Path 'C:\inetpub\wwwroot\hustcrm.jvs.com.vn\app'
(`$r.GetEnumerator() | ForEach-Object { "`$(`$_.Key)=`$(`$_.Value)" }) -join ';'
"@
Info "  $check"

if ($check -notmatch 'node=True') { Fail 'Server chua co Node.js tai C:\Program Files\nodejs' }
if ($check -notmatch 'appdir=True') {
    Fail 'Chua co thu muc app. Chay deploy/deploy-to-174.ps1 truoc de dung site, roi moi cai runner.'
}
if ($check -match 'svc=True') {
    Info 'Runner service DA TON TAI tren may nay. Neu muon cai lai, go truoc bang -Uninstall.'
    exit 0
}

# ---------- TẢI & GIẢI NÉN RUNNER ----------
Info "Tai GitHub Actions runner v$RunnerVersion ..."
$dl = Remote @"
`$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path '$InstallDir' | Out-Null
Set-Location '$InstallDir'
if (-not (Test-Path 'config.cmd')) {
    `$zip = "actions-runner-win-x64-$RunnerVersion.zip"
    if (-not (Test-Path `$zip)) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://github.com/actions/runner/releases/download/v$RunnerVersion/`$zip" -OutFile `$zip -UseBasicParsing
    }
    Expand-Archive -Path `$zip -DestinationPath . -Force
    Remove-Item `$zip -Force
    Write-Output 'DOWNLOADED'
} else {
    Write-Output 'ALREADY_EXTRACTED'
}
"@
Info "  $dl"

# ---------- ĐĂNG KÝ + CÀI LÀM WINDOWS SERVICE ----------
# --unattended: không hỏi tương tác. --replace: ghi đè nếu trùng tên runner cũ.
# --runasservice: chạy như Windows Service để tự khởi động cùng máy.
Info "Dang ky runner '$RunnerName' voi repo va cai lam Windows Service..."
$cfg = Remote @"
Set-Location '$InstallDir'
.\config.cmd --unattended --replace ``
  --url '$RepoUrl' ``
  --token $token ``
  --name '$RunnerName' ``
  --labels '$Labels' ``
  --work '_work' ``
  --runasservice
"@
Info $cfg

if ($cfg -match 'Failed|error|Error') {
    Fail 'Dang ky runner that bai. Kiem tra token con hieu luc (het han sau 1 gio) va quyen tren repo.'
}

# ---------- KIỂM CHỨNG ----------
Info 'Kiem chung service dang chay...'
$verify = Remote @"
`$svc = Get-Service | Where-Object { `$_.Name -like '*actions.runner*' } | Select-Object -First 1
if (`$svc) {
    if (`$svc.Status -ne 'Running') { Start-Service `$svc.Name; Start-Sleep -Seconds 4 }
    "`$(`$svc.Name) = `$((Get-Service `$svc.Name).Status)"
} else { 'KHONG TIM THAY SERVICE' }
"@
Info "  $verify"
if ($verify -match 'KHONG TIM THAY') { Fail 'Khong tao duoc runner service' }

Info ''
Info '===== CAI RUNNER XONG ====='
Info "  Runner   : $RunnerName (nhan: $Labels)"
Info "  Thu muc  : $InstallDir"
Info "  Kiem tra : $RepoUrl/settings/actions/runners  (phai thay trang thai Idle)"
Info ''
Info 'Tu gio: push vao main -> CI chay -> CI xanh thi CD tu deploy len'
Info 'https://hustcrm.jvs.com.vn (chi cap nhat code, KHONG chay migration/seed).'
