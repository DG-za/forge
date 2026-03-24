Remove-Item Env:CLAUDECODE -ErrorAction SilentlyContinue
Set-Location "C:\Programming\forge-40"
claude (Get-Content '.claude\claude-prompt-40.txt' -Raw -Encoding UTF8)
