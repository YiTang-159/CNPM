# Run once in PowerShell in YOUR existing Git clone. Never deletes physical files.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    & git rev-parse --is-inside-work-tree | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Not a Git clone' }
    $paths = @('.env', 'web/.env', 'mobile/android/app/debug.keystore',
        'db/data', 'backups', 'server/uploads', 'uploads', 'node_modules',
        'server/node_modules', 'web/node_modules', 'mobile/node_modules',
        'test-errors.txt', 'web/test-errors.txt')
    foreach ($path in $paths) {
        & git rm --cached -r --ignore-unmatch -- $path
        if ($LASTEXITCODE -ne 0) { throw "git rm --cached failed: $path" }
    }
    $tracked = @(& git ls-files)
    foreach ($path in $tracked) {
        if ($path -match '(?i)(\.keystore$|\.log$|\.bak$|\.mdf$|\.ldf$|\.sqlite$|\.sqlite3$|\.db$|\.mp3$|\.mp4$|\.wav$|(^|/)test-errors\.txt$)') {
            & git rm --cached --ignore-unmatch -- $path
            if ($LASTEXITCODE -ne 0) { throw "git rm --cached failed: $path" }
        }
    }
    Write-Host 'Git tracking detached; local data and SQL volumes remain untouched.'
    & python scripts/package-share.py --check
    if ($LASTEXITCODE -ne 0) { throw 'Packaging security check failed' }
} finally { Pop-Location }
