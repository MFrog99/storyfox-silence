# Сборка Windows-версии: PyInstaller (папка приложения) + Inno Setup (установщик .exe)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

python -m pip install --quiet pywebview pyinstaller "requests[socks]" typing-extensions

python -m PyInstaller --noconfirm --clean --windowed `
    --name "StoryFoxSilence" `
    --icon "$PSScriptRoot\build_assets\icon.ico" `
    --paths "$PSScriptRoot\core" --paths "$PSScriptRoot\vendor" `
    --collect-submodules yandex_music `
    --add-data "$PSScriptRoot\web;web" `
    --exclude-module pygame --exclude-module numpy --exclude-module PIL --exclude-module tkinter `
    --exclude-module matplotlib --exclude-module pandas --exclude-module PyQt5 --exclude-module PySide6 `
    --distpath build\pyi-dist --workpath build\pyi-work --specpath build `
    desktop\main.py
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller failed' }

$iscc = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 7\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) { throw 'Inno Setup не найден (https://jrsoftware.org/isdl.php)' }

& $iscc /Qp installer\StoryFoxSilence.iss
if ($LASTEXITCODE -ne 0) { throw 'Inno Setup failed' }
Get-Item dist\StoryFoxSilence-Setup.exe
