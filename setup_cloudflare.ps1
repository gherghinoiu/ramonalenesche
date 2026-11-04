# ==============================================================================
# Script Configurare Automata Cloudflare pentru ramonalenesche.ro (GitHub Pages)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Configurare Domeniu ramonalenesche.ro in Cloudflare    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$domain = "ramonalenesche.ro"
$cnameTarget = "gherghinoiu.github.io"
$ghPagesIPs = @("185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153")

# 1. Preluare Token API
$apiToken = $env:CLOUDFLARE_API_TOKEN
if (-not $apiToken) {
    $apiToken = Read-Host "Introduceti Cloudflare API Token (apasati Enter)"
}

if (-not $apiToken) {
    Write-Host "Eroare: Nu ati introdus un token valid. Rularea a fost anulata." -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type"  = "application/json"
}

# 2. Verificare Token
Write-Host "`n[1/5] Verificare token API..." -ForegroundColor Yellow
try {
    $verifyRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -Method Get
    if ($verifyRes.success -ne $true) {
        Write-Host "Eroare: Token-ul API este invalid sau revocat!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  -> Token validat cu succes! (Status: $($verifyRes.result.status))" -ForegroundColor Green
} catch {
    Write-Host "Eroare la apelarea API Cloudflare: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Preluare ID Cont Cloudflare
Write-Host "`n[2/5] Preluare cont Cloudflare..." -ForegroundColor Yellow
$accountsRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts" -Headers $headers -Method Get
if ($accountsRes.result.Count -eq 0) {
    Write-Host "Eroare: Nu s-a gasit niciun cont asociat acestui token!" -ForegroundColor Red
    exit 1
}
$accountId = $accountsRes.result[0].id
$accountName = $accountsRes.result[0].name
Write-Host "  -> Cont identificat: $accountName (ID: $accountId)" -ForegroundColor Green

# 4. Preluare sau Creare Zona DNS
Write-Host "`n[3/5] Verificare zona $domain..." -ForegroundColor Yellow
$zonesRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones?name=$domain" -Headers $headers -Method Get

if ($zonesRes.result.Count -gt 0) {
    $zone = $zonesRes.result[0]
    $zoneId = $zone.id
    Write-Host "  -> Zona exista deja (ID: $zoneId)" -ForegroundColor Green
} else {
    Write-Host "  -> Zona nu exista. Se creeaza zona $domain..." -ForegroundColor Cyan
    $createZoneBody = @{
        name    = $domain
        account = @{ id = $accountId }
        type    = "full"
    } | ConvertTo-Json

    $createRes = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones" -Headers $headers -Method Post -Body $createZoneBody
    $zone = $createRes.result
    $zoneId = $zone.id
    Write-Host "  -> Zona $domain a fost creata cu succes!" -ForegroundColor Green
}

$nameservers = $zone.name_servers

# 5. Configurare Inregistrari DNS
Write-Host "`n[4/5] Configurare inregistrari DNS pentru GitHub Pages..." -ForegroundColor Yellow

# Preluare inregistrari existente
$existingRecords = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method Get

# 5a. Creare inregistrari A
foreach ($ip in $ghPagesIPs) {
    $match = $existingRecords.result | Where-Object { $_.type -eq "A" -and $_.name -eq $domain -and $_.content -eq $ip }
    if (-not $match) {
        $body = @{
            type    = "A"
            name    = "@"
            content = $ip
            ttl     = 1
            proxied = $true
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $body | Out-Null
        Write-Host "  -> Creat inregistrare A: $domain -> $ip (Proxied)" -ForegroundColor Green
    } else {
        Write-Host "  -> Inregistrarea A pentru $ip exista deja." -ForegroundColor DarkGray
    }
}

# 5b. Creare inregistrare CNAME pentru www
$matchCname = $existingRecords.result | Where-Object { $_.type -eq "CNAME" -and $_.name -like "www.$domain*" }
if (-not $matchCname) {
    $bodyCname = @{
        type    = "CNAME"
        name    = "www"
        content = $cnameTarget
        ttl     = 1
        proxied = $true
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $bodyCname | Out-Null
    Write-Host "  -> Creat inregistrare CNAME: www.$domain -> $cnameTarget (Proxied)" -ForegroundColor Green
} else {
    Write-Host "  -> Inregistrarea CNAME www.$domain exista deja." -ForegroundColor DarkGray
}

# 6. Configurare SSL/TLS si Always Use HTTPS
Write-Host "`n[5/5] Configurare SSL/TLS si HTTPS..." -ForegroundColor Yellow
try {
    # Setare SSL Full
    $sslBody = @{ value = "full" } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/settings/ssl" -Headers $headers -Method Patch -Body $sslBody | Out-Null
    Write-Host "  -> SSL/TLS setat pe modul: Full" -ForegroundColor Green

    # Setare Always Use HTTPS
    $httpsBody = @{ value = "on" } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/settings/always_use_https" -Headers $headers -Method Patch -Body $httpsBody | Out-Null
    Write-Host "  -> Always Use HTTPS: Activat (ON)" -ForegroundColor Green
} catch {
    Write-Host "  -> Nota: Unele setari SSL pot necesita propagarea zonei: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 7. Afisare Rezumat & Nameservers pentru ROTLD
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "            CONFIGURARE FINALIZATA CU SUCCES!             " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "`nPasul final obligatoriu in panoul ROTLD (rotld.ro/home):" -ForegroundColor Yellow
Write-Host "Setati urmatoarele Name Servers la domeniul $domain :" -ForegroundColor White

if ($nameservers) {
    foreach ($ns in $nameservers) {
        Write-Host "   * $ns" -ForegroundColor Cyan
    }
} else {
    Write-Host "   (Verificati nameserverele alocate in Cloudflare dashboard)" -ForegroundColor Cyan
}

Write-Host "`nDupa salvarea nameserverelor in ROTLD, site-ul va fi accesibil securizat la:" -ForegroundColor Green
Write-Host "https://$domain" -ForegroundColor Cyan
Write-Host "https://www.$domain" -ForegroundColor Cyan
Write-Host ""
