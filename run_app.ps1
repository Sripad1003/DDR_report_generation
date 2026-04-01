# Start Backend
Write-Host "Starting Backend..."
Start-Job -ScriptBlock {
    cd "c:\Users\chili\Desktop\PROJECTS\task\backend"
    .\venv\Scripts\python.exe main.py
}

# Start Frontend
Write-Host "Starting Frontend..."
Start-Job -ScriptBlock {
    cd "c:\Users\chili\Desktop\PROJECTS\task\frontend"
    npm run dev
}

# Keep the script alive for a few seconds to let them start
Start-Sleep -Seconds 10
Get-Job
