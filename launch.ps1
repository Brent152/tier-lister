Set-Location 'C:\Users\brent_69v9d11\Documents\Github\tier-lister'

# Start the Vite dev server (minimized so it's out of the way but visible if needed).
$server = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm run dev' -PassThru -WindowStyle Minimized

# Wait until the server actually responds, instead of a fixed sleep that can race.
for ($i = 0; $i -lt 40; $i++) {
    try {
        Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 1 | Out-Null
        break
    } catch { Start-Sleep -Milliseconds 500 }
}

# Locate Chrome.
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }

# Dedicated app window with its own profile dir so the launched chrome.exe IS the
# window process and stays alive until the window is closed.
$profileDir = Join-Path $env:TEMP 'tierlister-chrome'
$chromeArgs = @(
    '--app=http://localhost:5173',
    "--user-data-dir=$profileDir",
    '--no-first-run',
    '--no-default-browser-check'
)
$browser = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -PassThru
$browser.WaitForExit()

# Window closed -> kill the dev server and its entire child tree (npm -> node/vite).
taskkill /PID $server.Id /T /F 2>$null | Out-Null
