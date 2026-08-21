# ==========================================
# DEPLOY University Enterprise CRM -> VPS .174 (chojuold.jvs.com.vn)
# ==========================================
# Chay TU MAY LOCAL. Script build ban production, day len server qua scp,
# roi cau hinh Windows Service (NSSM) + IIS site (reverse proxy) qua ssh.
#
#   powershell -NoProfile -File deploy/deploy-to-174.ps1
#   powershell -NoProfile -File deploy/deploy-to-174.ps1 -SkipBuild      # dung dist san co
#   powershell -NoProfile -File deploy/deploy-to-174.ps1 -AppOnly        # chi cap nhat code (khong dung IIS/DB)
#   powershell -NoProfile -File deploy/deploy-to-174.ps1 -Seed           # kem nap du lieu mau (GHI DE du lieu seed)
#   powershell -NoProfile -File deploy/deploy-to-174.ps1 -DryRun         # chi in ke hoach
#
# NGUYEN TAC AN TOAN (xem deploy/README.md):
#  - Chi TAO MOI, khong sua bat ky site/service/DB nao dang phuc vu.
#  - Port 3090 danh rieng cho app nay (3080 la cua zalocrm).
#  - KHONG restart IIS toan cuc, chi start site moi.
#  - KHONG dung <serverVariables> trong web.config (anh huong toan server).

param(
    [switch]$SkipBuild,
    [switch]$AppOnly,
    # Chay seed du lieu mau. KHONG bat mac dinh: seed dung upsert nen se ghi de
    # ten/vai tro/don vi cua cac user seed va KICH HOAT LAI tai khoan da bi vo
    # hieu hoa, cung ghi de noi dung DN/MOU/task neu admin da sua tren that.
    # Chi dung cho lan khoi tao dau tien hoac khi co chu dich nap lai du lieu mau.
    [switch]$Seed,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# ==========================================
# BI MAT - DOC TU BIEN MOI TRUONG, KHONG HARDCODE
# ==========================================
# File nay nam trong git nen TUYET DOI khong nhung mat khau vao day.
# Truoc khi chay, set 2 bien sau trong phien PowerShell:
#
#   $env:PG174_PASSWORD    = '<mat khau user postgres tren .174>'
#   $env:CRM_SEED_PASSWORD = '<mat khau khoi tao cho tai khoan seed>'
#
if (-not $env:PG174_PASSWORD) {
    Write-Host "[deploy] LOI: chua set `$env:PG174_PASSWORD (mat khau PostgreSQL tren .174)." -ForegroundColor Red
    Write-Host "         Vi du:  `$env:PG174_PASSWORD = '<mat khau>'" -ForegroundColor Yellow
    exit 1
}
if (-not $env:CRM_SEED_PASSWORD) {
    Write-Host "[deploy] LOI: chua set `$env:CRM_SEED_PASSWORD (mat khau khoi tao tai khoan seed)." -ForegroundColor Red
    Write-Host "         Dat mot mat khau manh; doi lai ngay sau lan dang nhap dau tien." -ForegroundColor Yellow
    exit 1
}
$PgPassword   = $env:PG174_PASSWORD
$SeedPassword = $env:CRM_SEED_PASSWORD

# --- Tham so co dinh cua moi truong .174 ---
$SshHost      = 'jvsadm-174'
$Domain       = 'hustcrm.jvs.com.vn'
$ServiceName  = 'hustcrm'
# Site dir = document root cua IIS (chi chua web.config).
# Code Node nam trong thu muc con "app" nen KHONG the bi IIS phuc vu nhu file tinh
# (web.config rewrite moi request sang Node + requestFiltering chan .env/.map/node_modules).
$SiteDir      = "C:\inetpub\wwwroot\$Domain"
$AppDir       = "$SiteDir\app"
$LogDir       = "$SiteDir\logs"
# node_modules (~347MB, phan lon la Prisma engine) DAT NGOAI site folder:
#  - IIS document root chi con ~1.3MB (dist + prisma + package.json), gon va de soi
#  - khong co 6.000+ file thu vien nam duoi document root
# Lien ket bang NODE_PATH tren service (xem buoc 8). Da kiem chung Prisma engine
# van hoat dong binh thuong khi resolve qua NODE_PATH.
$RuntimeDir   = "C:\apps\$ServiceName-runtime"
$AppPort      = 3090
$NssmPath     = 'C:\apps\tools\nssm.exe'
$NodeExe      = 'C:\Program Files\nodejs\node.exe'
$CertThumb    = '484E5CDD48CF9DA40D026BB1C5570400A501A150'   # Cloudflare Origin Cert dung chung cho *.jvs.com.vn
# Cert nam o store "WebHosting" (KHONG phai "My") - moi site tren .174 deu binding tu day.
$CertStore    = 'WebHosting'
$DbName       = 'university_crm'
$PgBin        = 'C:\Program Files\PostgreSQL\18\bin'
$ProjectRoot  = Split-Path -Parent $PSScriptRoot

function Info($m) { Write-Host "[deploy] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[deploy] $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[deploy] LOI: $m" -ForegroundColor Red; exit 1 }

# Chay lenh tren server, loc bo banner SSH gay nhieu output.
# LUU Y: OpenSSH in canh bao post-quantum ra STDERR. Voi $ErrorActionPreference='Stop',
# neu dung "2>&1" thi PowerShell 5.1 boc moi dong stderr thanh ErrorRecord va NEM LOI
# du ssh thanh cong (exit 0). Vi vay tam ha ErrorActionPreference quanh lenh goi ssh
# va doc stderr qua bien rieng.
function Remote($psCommand) {
    if ($DryRun) { Write-Host "  [dry-run] ssh $SshHost powershell: $($psCommand.Substring(0, [Math]::Min(120, $psCommand.Length)))..." -ForegroundColor DarkGray; return '' }
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($psCommand))
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = & ssh $SshHost "powershell -NonInteractive -EncodedCommand $encoded" 2>$null
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($null -eq $out) { return '' }
    $clean = $out | Where-Object { "$_" -notmatch 'WARNING|store now|openssh\.com|may need to be upgraded' }
    return (($clean | ForEach-Object { "$_" }) -join "`n")
}

# scp cung in banner ra stderr -> boc lai tuong tu.
function Copy-ToServer($from, $to) {
    if ($DryRun) { Write-Host "  [dry-run] scp $from -> $to" -ForegroundColor DarkGray; return }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & scp.exe -q -r $from $to 2>$null
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($code -ne 0) { Fail "scp that bai (exit $code): $from -> $to" }
}

Info "Bat dau deploy $Domain (port $AppPort, service $ServiceName)"
if ($DryRun) { Warn 'Che do DRY-RUN: chi in ke hoach, khong thay doi gi.' }

# ---------- 1. Build ban production ----------
if (-not $SkipBuild) {
    Info 'Build frontend + backend (npm run build)...'
    if (-not $DryRun) {
        Push-Location $ProjectRoot
        try {
            & npm run lint
            if ($LASTEXITCODE -ne 0) { Fail 'Lint that bai - dung deploy.' }
            & npm run build
            if ($LASTEXITCODE -ne 0) { Fail 'Build that bai - dung deploy.' }
        } finally { Pop-Location }
    }
} else { Warn 'Bo qua build (-SkipBuild), dung dist san co.' }

$distPath = Join-Path $ProjectRoot 'dist'
if (-not $DryRun -and -not (Test-Path (Join-Path $distPath 'server.cjs'))) {
    Fail "Khong tim thay $distPath\server.cjs. Chay 'npm run build' truoc."
}

# ---------- 2. Kiem tra tien de tren server ----------
Info 'Kiem tra moi truong tren server...'
$check = Remote @"
`$r = [ordered]@{}
`$r['nssm']  = Test-Path '$NssmPath'
`$r['node']  = Test-Path '$NodeExe'
`$r['pg']    = Test-Path '$PgBin\psql.exe'
`$r['port']  = [bool](Get-NetTCPConnection -State Listen -LocalPort $AppPort -ErrorAction SilentlyContinue)
`$r['svc']   = [bool](Get-Service -Name '$ServiceName' -ErrorAction SilentlyContinue)
Import-Module WebAdministration -ErrorAction SilentlyContinue
`$r['site']  = [bool](Get-Item "IIS:\Sites\$Domain" -ErrorAction SilentlyContinue)
`$r['cert']  = [bool](Get-ChildItem Cert:\LocalMachine\$CertStore | Where-Object { `$_.Thumbprint -eq '$CertThumb' })
(`$r.GetEnumerator() | ForEach-Object { "`$(`$_.Key)=`$(`$_.Value)" }) -join ';'
"@
if (-not $DryRun) {
    Info "  $check"
    if ($check -notmatch 'nssm=True') { Fail "Khong tim thay NSSM tai $NssmPath" }
    if ($check -notmatch 'node=True') { Fail "Khong tim thay Node tai $NodeExe" }
    if ($check -notmatch 'cert=True') { Fail "Khong tim thay cert wildcard $CertThumb tren server" }
    # Port dang bi chiem boi service KHAC => dung ngay, tranh dap vao app dang phuc vu.
    if ($check -match 'port=True' -and $check -notmatch 'svc=True') {
        Fail "Port $AppPort dang bi tien trinh khac su dung. Doi port truoc khi deploy."
    }
}

# ---------- 3. Tao DB (chi khi chua co) ----------
if (-not $AppOnly) {
    Info "Tao database '$DbName' neu chua co..."
    $dbOut = Remote @"
`$env:PGPASSWORD = '$PgPassword'
`$exists = & '$PgBin\psql.exe' -U postgres -h 127.0.0.1 -p 5432 -Atc "SELECT 1 FROM pg_database WHERE datname='$DbName';"
if (`$exists -eq '1') {
    Write-Output 'DB_EXISTS'
} else {
    & '$PgBin\psql.exe' -U postgres -h 127.0.0.1 -p 5432 -Atc "CREATE DATABASE `"$DbName`" ENCODING 'UTF8' TEMPLATE template0;"
    Write-Output 'DB_CREATED'
}
"@
    if (-not $DryRun) { Info "  $dbOut" }
}

# ---------- 4. Dung service cu (neu dang chay) truoc khi ghi de file ----------
$svcExists = ($check -match 'svc=True')
if ($svcExists) {
    Info "Dung service '$ServiceName' truoc khi cap nhat file..."
    Remote "& '$NssmPath' stop $ServiceName; Start-Sleep -Seconds 3" | Out-Null
}

# ---------- 5. Day code len server ----------
Info "Day dist + prisma + package.json len $AppDir ..."
if (-not $DryRun) {
    Remote @"
New-Item -ItemType Directory -Force -Path '$SiteDir' | Out-Null
New-Item -ItemType Directory -Force -Path '$AppDir' | Out-Null
New-Item -ItemType Directory -Force -Path '$LogDir' | Out-Null
New-Item -ItemType Directory -Force -Path '$RuntimeDir' | Out-Null
New-Item -ItemType Directory -Force -Path '$AppDir\uploads' | Out-Null
# Xoa dist cu de khong con file js/css bam version cu (hash filename)
if (Test-Path '$AppDir\dist') { Remove-Item '$AppDir\dist' -Recurse -Force }
New-Item -ItemType Directory -Force -Path '$AppDir\dist' | Out-Null
"@ | Out-Null

    $remoteBase = "${SshHost}:$($AppDir -replace '\\','/')/"
    Copy-ToServer $distPath                   $remoteBase
    Copy-ToServer "$ProjectRoot\prisma"       $remoteBase
    Copy-ToServer "$ProjectRoot\package.json" "${remoteBase}package.json"
}

# ---------- 6. Tao .env tren server (chi khi chua co, tranh ghi de secret) ----------
Info 'Chuan bi file .env tren server...'
$envOut = Remote @"
if (Test-Path '$AppDir\.env') {
    Write-Output 'ENV_KEPT'
} else {
    `$secret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]`$_ })
    `$lines = @(
        'NODE_ENV=production',
        'PORT=$AppPort',
        'HOST=127.0.0.1',
        'APP_URL=https://$Domain',
        "JWT_SECRET=`$secret",
        'JWT_EXPIRES_IN=8h',
        'BCRYPT_ROUNDS=12',
        'DB_BACKEND=prisma',
        'DATABASE_URL=postgresql://postgres:$PgPassword@127.0.0.1:5432/$DbName`?schema=public',
        'SEED_DEFAULT_PASSWORD=$SeedPassword',
        'CORS_ORIGINS=',
        'UPLOAD_DIR=$AppDir\uploads'
    )
    Set-Content -Path '$AppDir\.env' -Value `$lines -Encoding utf8
    Write-Output 'ENV_CREATED'
}
"@
if (-not $DryRun) { Info "  $envOut" }

# ---------- 7. Cai dependency production + Prisma client ----------
if (-not $AppOnly) {
    Info 'Cai dependency production vao thu muc runtime (co the mat vai phut)...'
    # package.json + prisma/ duoc copy sang RuntimeDir de npm/prisma lam viec o day.
    # AppDir van giu ban sao package.json cho tien tra cuu, nhung KHONG co node_modules.
    $npmOut = Remote @"
Copy-Item '$AppDir\package.json' '$RuntimeDir\package.json' -Force
if (Test-Path '$RuntimeDir\prisma') { Remove-Item '$RuntimeDir\prisma' -Recurse -Force }
Copy-Item '$AppDir\prisma' '$RuntimeDir' -Recurse -Force
Set-Location '$RuntimeDir'
& npm install --omit=dev --no-audit --no-fund 2>&1 | Select-Object -Last 5
& npx prisma generate 2>&1 | Select-Object -Last 3
# Bo cache npm (~38MB) sau khi cai xong - khong can cho runtime.
& npm cache clean --force 2>&1 | Out-Null
# Neu lan deploy truoc da tao node_modules trong site folder thi don di.
if (Test-Path '$AppDir\node_modules') {
    Remove-Item '$AppDir\node_modules' -Recurse -Force
    Write-Output 'DA_DON_node_modules_trong_site_folder'
}
"@
    if (-not $DryRun) { Info "  $npmOut" }

    # migrate deploy chi AP DUNG migration chua chay, khong xoa/sua du lieu san co.
    Info 'Ap dung migration (khong dung du lieu san co)...'
    $dbOut2 = Remote @"
Set-Location '$RuntimeDir'
& npx prisma migrate deploy 2>&1 | Select-Object -Last 4
"@
    if (-not $DryRun) { Info "  $dbOut2" }

    if ($Seed) {
        Warn 'Dang chay SEED: se ghi de du lieu mau (user/DN/MOU/task) theo id co dinh.'
        $seedOut = Remote @"
Set-Location '$RuntimeDir'
& npx tsx prisma/seed.ts 2>&1 | Select-Object -Last 3
"@
        if (-not $DryRun) { Info "  $seedOut" }
    } else {
        Info 'Bo qua seed (mac dinh). Them -Seed neu can nap du lieu mau.'
    }
}

# ---------- 8. Tao / cap nhat Windows Service qua NSSM ----------
Info "Cau hinh Windows Service '$ServiceName'..."
$svcOut = Remote @"
`$svc = Get-Service -Name '$ServiceName' -ErrorAction SilentlyContinue
if (-not `$svc) {
    & '$NssmPath' install $ServiceName '$NodeExe' 'dist\server.cjs' | Out-Null
    Write-Output 'SVC_CREATED'
} else {
    Write-Output 'SVC_EXISTS'
}
& '$NssmPath' set $ServiceName Application '$NodeExe'           | Out-Null
& '$NssmPath' set $ServiceName AppParameters 'dist\server.cjs'  | Out-Null
& '$NssmPath' set $ServiceName AppDirectory '$AppDir'           | Out-Null
& '$NssmPath' set $ServiceName AppStdout '$LogDir\app.out.log'  | Out-Null
& '$NssmPath' set $ServiceName AppStderr '$LogDir\app.err.log'  | Out-Null
& '$NssmPath' set $ServiceName AppRotateFiles 1                 | Out-Null
& '$NssmPath' set $ServiceName AppRotateOnline 1                | Out-Null
& '$NssmPath' set $ServiceName AppRotateBytes 20971520          | Out-Null
& '$NssmPath' set $ServiceName AppRestartDelay 5000             | Out-Null
& '$NssmPath' set $ServiceName AppStopMethodConsole 20000       | Out-Null
# NODE_PATH cho Node tim thu vien o thu muc runtime nam ngoai site folder.
& '$NssmPath' set $ServiceName AppEnvironmentExtra "NODE_PATH=$RuntimeDir\node_modules" | Out-Null
& '$NssmPath' set $ServiceName Start SERVICE_AUTO_START         | Out-Null
& '$NssmPath' start $ServiceName | Out-Null
Start-Sleep -Seconds 6
(Get-Service -Name '$ServiceName').Status
"@
if (-not $DryRun) { Info "  $svcOut" }

# ---------- 9. Kiem tra app da len chua (goi truc tiep 127.0.0.1) ----------
Info 'Kiem tra app tra loi tren 127.0.0.1...'
$health = Remote @"
try {
    `$r = Invoke-WebRequest -Uri 'http://127.0.0.1:$AppPort/' -UseBasicParsing -TimeoutSec 20
    Write-Output "HTTP `$(`$r.StatusCode)"
} catch {
    Write-Output "FAIL `$(`$_.Exception.Message)"
    Write-Output '--- app.err.log (20 dong cuoi) ---'
    if (Test-Path '$LogDir\app.err.log') { Get-Content '$LogDir\app.err.log' -Tail 20 }
}
"@
if (-not $DryRun) {
    Info "  $health"
    if ($health -notmatch 'HTTP 200') { Fail "App khong tra loi tren port $AppPort. Xem log o $LogDir" }
}

# ---------- 10. Tao IIS site + binding HTTPS (chi khi chua co) ----------
if (-not $AppOnly) {
    Info "Cau hinh IIS site '$Domain'..."
    if (-not $DryRun) {
        Remote "New-Item -ItemType Directory -Force -Path '$SiteDir' | Out-Null" | Out-Null
        Copy-ToServer "$PSScriptRoot\web.config" "${SshHost}:$($SiteDir -replace '\\','/')/web.config"
    }

    $iisOut = Remote @"
Import-Module WebAdministration
`$site = Get-Item "IIS:\Sites\$Domain" -ErrorAction SilentlyContinue
if (-not `$site) {
    New-WebSite -Name '$Domain' -PhysicalPath '$SiteDir' -Port 443 -HostHeader '$Domain' -Ssl | Out-Null
    Write-Output 'SITE_CREATED'
} else {
    Write-Output 'SITE_EXISTS'
}
# Gan cert wildcard dung chung (khong tao cert moi)
`$binding = Get-WebBinding -Name '$Domain' -Protocol https -ErrorAction SilentlyContinue
if (-not `$binding) {
    New-WebBinding -Name '$Domain' -Protocol https -Port 443 -HostHeader '$Domain' -SslFlags 1 | Out-Null
    `$binding = Get-WebBinding -Name '$Domain' -Protocol https
}
`$cert = Get-ChildItem Cert:\LocalMachine\$CertStore | Where-Object { `$_.Thumbprint -eq '$CertThumb' }
if (`$cert) { `$binding.AddSslCertificate('$CertThumb', '$CertStore') }
Start-Website -Name '$Domain' -ErrorAction SilentlyContinue
(Get-Website -Name '$Domain').State
"@
    if (-not $DryRun) { Info "  $iisOut" }
}

# ---------- 11. Ket luan ----------
Info ''
Info '===== DEPLOY XONG ====='
Info "  URL       : https://$Domain"
Info "  Service   : $ServiceName (NSSM) -> 127.0.0.1:$AppPort"
Info "  Code      : $AppDir  (chi dist/prisma/package.json)"
Info "  Runtime   : $RuntimeDir\node_modules  (ngoai site folder)"
Info "  Log       : $LogDir\app.out.log / app.err.log"
Info "  Database  : $DbName (PostgreSQL 18 tren chinh .174)"
Info ''
Info 'Tai khoan quan tri: admin@hust.edu.vn'
Info 'Mat khau = gia tri $env:CRM_SEED_PASSWORD da dat khi chay script.'
Warn 'BAT BUOC: dang nhap va doi mat khau moi tai khoan seed ngay sau khi deploy.'
