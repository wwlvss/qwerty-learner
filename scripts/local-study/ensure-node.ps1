$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
$base = 'https://nodejs.org/dist/latest-v24.x/'
$checksums = (Invoke-WebRequest -UseBasicParsing -Uri ($base + 'SHASUMS256.txt')).Content
$line = $checksums -split "`n" | Where-Object { $_ -match "node-v24\.[0-9]+\.[0-9]+-win-$arch\.zip\s*$" } | Select-Object -First 1
if (-not $line) { throw 'No matching official Node.js package was found.' }
$fields = $line.Trim() -split '\s+'
$expected = $fields[0]
$file = $fields[1]
$temp = Join-Path $PSScriptRoot 'runtime-download'
New-Item -ItemType Directory -Force -Path $temp | Out-Null
try {
  $zip = Join-Path $temp $file
  Invoke-WebRequest -UseBasicParsing -Uri ($base + $file) -OutFile $zip
  if ((Get-FileHash -Algorithm SHA256 $zip).Hash.ToLowerInvariant() -ne $expected.ToLowerInvariant()) { throw 'SHA256 verification failed.' }
  Expand-Archive -LiteralPath $zip -DestinationPath $temp -Force
  $folder = Join-Path $temp ([IO.Path]::GetFileNameWithoutExtension($file))
  $runtime = Join-Path $PSScriptRoot 'runtime'
  New-Item -ItemType Directory -Force -Path $runtime | Out-Null
  Copy-Item -Path (Join-Path $folder '*') -Destination $runtime -Recurse -Force
} finally {
  if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
Write-Host 'Portable Node.js is ready. No administrator installation was needed.'
