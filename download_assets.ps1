# download_assets.ps1
# Script to download and extract retro fonts, weather icons, radar, and moon phases.

$ProgressPreference = 'SilentlyContinue'

# Define URLs
$urls = @{
    "Star4000.zip" = "https://twccfiles.com/downloads/Star4000.zip"
    "Star3000.zip" = "https://twccfiles.com/downloads/Star3000.zip"
    "StarJR.zip"   = "https://twccfiles.com/downloads/StarJR.zip"
    "ccef.zip"     = "https://twccfiles.com/downloads/ccef.zip"
    "rcrf.zip"     = "https://twccfiles.com/downloads/rcrf.zip"
    "moon.zip"     = "https://twccfiles.com/downloads/Moon%20phases.zip"
}

# Create temp download directory
$tempDir = New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "temp_assets")

# Download all ZIPs
foreach ($file in $urls.Keys) {
    $url = $urls[$file]
    $dest = Join-Path $tempDir $file
    Write-Host "Downloading $url to $dest ..."
    Invoke-WebRequest -Uri $url -OutFile $dest
}

# Create target directories
$fontsDir = New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "public\fonts")
$weatherIconsDir = New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "public\images\weather")
$radarDir = New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "public\images\radar")
$moonDir = New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "public\images\moon")

# Extract zips
Write-Host "Extracting Star4000.zip..."
Expand-Archive -Path (Join-Path $tempDir "Star4000.zip") -DestinationPath (Join-Path $fontsDir "Star4000") -Force

Write-Host "Extracting Star3000.zip..."
Expand-Archive -Path (Join-Path $tempDir "Star3000.zip") -DestinationPath (Join-Path $fontsDir "Star3000") -Force

Write-Host "Extracting StarJR.zip..."
Expand-Archive -Path (Join-Path $tempDir "StarJR.zip") -DestinationPath (Join-Path $fontsDir "StarJR") -Force

Write-Host "Extracting ccef.zip (weather icons)..."
Expand-Archive -Path (Join-Path $tempDir "ccef.zip") -DestinationPath $weatherIconsDir -Force

Write-Host "Extracting rcrf.zip (radar maps)..."
Expand-Archive -Path (Join-Path $tempDir "rcrf.zip") -DestinationPath $radarDir -Force

Write-Host "Extracting moon.zip (moon phases)..."
Expand-Archive -Path (Join-Path $tempDir "moon.zip") -DestinationPath $moonDir -Force

Write-Host "Assets downloaded and extracted successfully!"
