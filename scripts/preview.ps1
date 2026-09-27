param([switch]$Open)

# Render the homepage's HTML/Liquid subset directly from its real source files.
# This does not replace a full Jekyll build of the archive pages or feeds.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$config = Get-Content -LiteralPath (Join-Path $projectRoot '_config.yml') -Raw -Encoding UTF8
$authorConfig = [regex]::Match($config, '(?ms)^author:\r?\n(.*?)(?=^\S)').Groups[1].Value

function Read-Scalar([string]$Text, [string]$Key) {
    $match = [regex]::Match($Text, '(?m)^\s*' + [regex]::Escape($Key) + '\s*:\s*([^\r\n]*)')
    if (-not $match.Success) { throw "Missing configuration value: $Key" }
    $value = $match.Groups[1].Value.Trim()
    if ($value.StartsWith('"')) {
        $quoted = [regex]::Match($value, '^"(?:\\.|[^"\\])*"').Value
        return ($quoted | ConvertFrom-Json)
    }
    if ($value.StartsWith("'")) {
        return [regex]::Match($value, "^'((?:[^']|'')*)'").Groups[1].Value.Replace("''", "'")
    }
    return ($value -replace '\s+#.*$', '').Trim()
}

$values = @{
    'site.title' = Read-Scalar $config 'title'
    'site.url' = Read-Scalar $config 'url'
    'site.baseurl' = Read-Scalar $config 'baseurl'
}
foreach ($key in @('name', 'bio', 'avatar', 'email', 'github', 'googlescholar', 'cv_link')) {
    $values["site.author.$key"] = Read-Scalar $authorConfig $key
}

$page = Get-Content -LiteralPath (Join-Path $projectRoot '_pages/about.md') -Raw -Encoding UTF8
$content = [regex]::Replace($page, '\A---\r?\n.*?\r?\n---\r?\n', '', [Text.RegularExpressions.RegexOptions]::Singleline)
$html = Get-Content -LiteralPath (Join-Path $projectRoot '_layouts/home.html') -Raw -Encoding UTF8
$html = $html.Replace('{{ content }}', $content)
$html = [regex]::Replace($html, '{%\s*include\s+(personal-(?:header|footer)\.html)\s*%}', {
    param($match)
    Get-Content -LiteralPath (Join-Path $projectRoot "_includes/$($match.Groups[1].Value)") -Raw -Encoding UTF8
})
$html = $html.Replace("{{ site.time | date: '%Y' }}", (Get-Date -Format yyyy))
$html = [regex]::Replace($html, '{{\s*(site\.[\w.]+)\s*(\|\s*escape)?\s*}}', {
    param($match)
    $key = $match.Groups[1].Value
    if (-not $values.ContainsKey($key)) { throw "Unsupported preview variable: $key" }
    $value = [string]$values[$key]
    if ($match.Groups[2].Success) { return [Net.WebUtility]::HtmlEncode($value) }
    return $value
})
if ($html -match '{{|{%') { throw 'The homepage uses Liquid syntax not supported by this lightweight preview. Use Jekyll for a full build.' }

# File-relative resources make the preview work by double-clicking index.html.
# Generated Jekyll-only routes (sitemap/feed) point to the existing public site.
$basePath = [string]$values['site.baseurl']
$publicUrl = ([string]$values['site.url']).TrimEnd('/')
$html = [regex]::Replace($html, '(href|src)="(/[^"]*)"', {
    param($match)
    $attribute = $match.Groups[1].Value
    $target = $match.Groups[2].Value
    $localTarget = $target
    if ($basePath -and $target.StartsWith($basePath + '/')) { $localTarget = $target.Substring($basePath.Length) }
    if ($localTarget -eq '/') {
        $target = '#main'
    } elseif ($localTarget.StartsWith('/#')) {
        $target = $localTarget.Substring(1)
    } elseif (Test-Path -LiteralPath (Join-Path $projectRoot $localTarget.TrimStart('/')) -PathType Leaf) {
        $target = '../../' + $localTarget.TrimStart('/')
    } else {
        $target = $publicUrl + $target
    }
    return $attribute + '="' + $target + '"'
})

$previewDirectory = Join-Path $projectRoot 'local/preview'
New-Item -ItemType Directory -Path $previewDirectory -Force | Out-Null
$previewFile = Join-Path $previewDirectory 'index.html'
[IO.File]::WriteAllText($previewFile, $html, [Text.UTF8Encoding]::new($false))
Write-Host "Homepage preview ready: $previewFile"
if ($Open) { Start-Process -FilePath $previewFile }
