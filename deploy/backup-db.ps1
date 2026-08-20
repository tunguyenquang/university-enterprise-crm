# ==========================================
# BACKUP DATABASE University Enterprise CRM
# ==========================================
# Sao luu DB bang pg_dump ra file .sql (dinh dang plain, nen gzip neu co).
# Chay duoc cho ca DB local (dev) va DB tren VPS .174 (production).
#
#   powershell -NoProfile -File deploy/backup-db.ps1                 # backup DB local (doc .env)
#   powershell -NoProfile -File deploy/backup-db.ps1 -Target remote  # backup DB tren .174
#   powershell -NoProfile -File deploy/backup-db.ps1 -OutDir D:\bak  # chon noi luu
#   powershell -NoProfile -File deploy/backup-db.ps1 -KeepDays 14    # xoa ban cu hon 14 ngay
#
# CHI DOC du lieu (pg_dump), khong sua gi tren DB.
# File backup KHONG duoc commit len git (.gitignore da chan thu muc backups/).

param(
    [ValidateSet('local', 'remote')]
    [string]$Target = 'local',
    [string]$OutDir = '',
    [int]$KeepDays = 30
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $ProjectRoot 'backups' }

function Info($m) { Write-Host "[backup] $m" -ForegroundColor Cyan }
function Fail($m) { Write-Host "[backup] LOI: $m" -ForegroundColor Red; exit 1 }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if ($Target -eq 'local') {
    # --- Doc DATABASE_URL tu .env de khong hardcode thong tin ket noi ---
    $envFile = Join-Path $ProjectRoot '.env'
    if (-not (Test-Path $envFile)) { Fail "Khong tim thay $envFile" }
    $line = Select-String -Path $envFile -Pattern '^DATABASE_URL=' | Select-Object -First 1
    if (-not $line) { Fail 'Khong tim thay DATABASE_URL trong .env' }
    $url = $line.Line -replace '^DATABASE_URL=', '' -replace '^"', '' -replace '"$', ''

    $uri    = [Uri]$url
    $dbName = $uri.AbsolutePath.TrimStart('/')
    $user   = [Uri]::UnescapeDataString($uri.UserInfo.Split(':')[0])
    $pass   = [Uri]::UnescapeDataString($uri.UserInfo.Split(':')[1])
    $port   = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

    # pg_dump phai cung dong version voi server, uu tien ban moi nhat co san.
    $pgDump = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
        Sort-Object { [int]($_.Directory.Parent.Name) } -Descending | Select-Object -First 1
    if (-not $pgDump) {
        $cmd = Get-Command pg_dump -ErrorAction SilentlyContinue
        if ($cmd) { $pgDump = $cmd.Source } else { Fail 'Khong tim thay pg_dump' }
    }

    $outFile = Join-Path $OutDir "$dbName-local-$stamp.sql"
    Info "Backup DB local '$dbName' (port $port) -> $outFile"

    $env:PGPASSWORD = $pass
    & $pgDump -U $user -h $uri.Host -p $port -d $dbName --no-owner --no-privileges -f $outFile
    if ($LASTEXITCODE -ne 0) { Fail "pg_dump that bai (exit $LASTEXITCODE)" }
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
else {
    # --- Backup DB tren .174: chay pg_dump TAI CHO roi keo file ve local ---
    # Mat khau doc tu bien moi truong - file nay nam trong git, khong hardcode.
    if (-not $env:PG174_PASSWORD) {
        Fail 'Chua set $env:PG174_PASSWORD (mat khau PostgreSQL tren .174). Vi du: $env:PG174_PASSWORD = ''<mat khau>'''
    }
    $pgPassword = $env:PG174_PASSWORD
    $SshHost   = 'jvsadm-174'
    $dbName    = 'university_crm'
    $pgBin     = 'C:\Program Files\PostgreSQL\18\bin'
    $remoteTmp = "C:\Windows\Temp\$dbName-$stamp.sql"
    $outFile   = Join-Path $OutDir "$dbName-174-$stamp.sql"

    Info "Backup DB '$dbName' tren $SshHost -> $outFile"
    $cmd = @"
`$env:PGPASSWORD = '$pgPassword'
& '$pgBin\pg_dump.exe' -U postgres -h 127.0.0.1 -p 5432 -d $dbName --no-owner --no-privileges -f '$remoteTmp'
if (`$LASTEXITCODE -ne 0) { Write-Output 'DUMP_FAILED'; exit 1 }
(Get-Item '$remoteTmp').Length
"@
    # OpenSSH in canh bao post-quantum ra STDERR. Voi $ErrorActionPreference='Stop',
    # dung "2>&1" se lam PowerShell 5.1 boc moi dong stderr thanh ErrorRecord va NEM LOI
    # du ssh thanh cong (exit 0) -> tam ha xuong 'Continue' va bo stderr di.
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $raw = & ssh.exe $SshHost "powershell -NonInteractive -EncodedCommand $encoded" 2>$null
        & scp.exe -q "${SshHost}:$($remoteTmp -replace '\\','/')" $outFile 2>$null
        $scpCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
    $size = (($raw | Where-Object { "$_" -notmatch 'WARNING|store now|openssh\.com|may need to be upgraded' }) -join "`n")
    if ("$size" -match 'DUMP_FAILED') { Fail 'pg_dump tren server that bai' }
    if ($scpCode -ne 0) { Fail 'scp file backup ve local that bai' }

    # Doi chieu kich thuoc 2 dau roi moi xoa file tam tren server.
    $localSize = (Get-Item $outFile).Length
    $remoteSize = [int64]("$size".Trim() -split "`n" | Select-Object -Last 1)
    if ($localSize -ne $remoteSize) {
        Fail "Kich thuoc lech (server=$remoteSize, local=$localSize) - GIU file tam tren server de kiem tra."
    }
    $rm = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("Remove-Item '$remoteTmp' -Force"))
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & ssh.exe $SshHost "powershell -NonInteractive -EncodedCommand $rm" 2>$null | Out-Null }
    finally { $ErrorActionPreference = $prev }
}

$info = Get-Item $outFile
Info ("Xong: {0} ({1:N2} MB)" -f $info.Name, ($info.Length / 1MB))

# --- Don ban backup qua cu ---
if ($KeepDays -gt 0) {
    $cutoff = (Get-Date).AddDays(-$KeepDays)
    $old = Get-ChildItem $OutDir -Filter '*.sql' | Where-Object { $_.LastWriteTime -lt $cutoff }
    if ($old) {
        Info "Xoa $($old.Count) ban backup cu hon $KeepDays ngay..."
        $old | Remove-Item -Force
    }
}

Info 'Khoi phuc khi can:'
Info "  psql -U postgres -h <host> -p <port> -d <db_moi> -f `"$outFile`""
Info '  (tao DB moi roi restore vao do, KHONG restore de len DB dang phuc vu)'
