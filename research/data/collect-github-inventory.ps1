$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$inventoryDir = $PSScriptRoot
if (Test-Path -LiteralPath (Join-Path $inventoryDir 'snapshot-manifest.json')) {
  throw 'This search-discovered snapshot is sealed. Copy the collector into a new dated output directory for a new collection; do not overwrite this snapshot.'
}
$repoById = @{}
$searches = [System.Collections.Generic.List[object]]::new()
$searchPlan = @(
  @{ query='avito in:name,description'; pages=10 },
  @{ query='авито in:name,description'; pages=3 },
  @{ query='avito-mcp'; pages=1 },
  @{ query='avito extension in:name,description,readme'; pages=1 },
  @{ query='avito AI in:name,description'; pages=1 },
  @{ query='avito llm in:name,description'; pages=1 },
  @{ query='avito chatgpt in:name,description'; pages=1 },
  @{ query='avito bot in:name,description'; pages=2 },
  @{ query='avito price in:name,description'; pages=1 },
  @{ query='avito monitor in:name,description'; pages=1 }
)
$existingCatalogPath = Join-Path $inventoryDir 'github-repositories.json'
$existingCoveragePath = Join-Path $inventoryDir 'search-coverage.json'
if (Test-Path -LiteralPath $existingCatalogPath) {
  $existingCatalog=Get-Content -LiteralPath $existingCatalogPath -Raw | ConvertFrom-Json
  foreach ($repo in $existingCatalog.repositories) { $repoById[[string]$repo.id]=$repo }
}
if (Test-Path -LiteralPath $existingCoveragePath) {
  $existingCoverage=Get-Content -LiteralPath $existingCoveragePath -Raw | ConvertFrom-Json
  foreach ($entry in $existingCoverage.searches) { $searches.Add($entry) }
}

function Write-Inventory {
  $stamp = [DateTime]::UtcNow.ToString('o')
  $repos = @($repoById.Values | Sort-Object full_name)
  $out = [ordered]@{
    schema_version='1.0'; checked_at_utc=$stamp; source='GitHub REST API, public unauthenticated repository search';
    verification_level='metadata_only'; runtime_tested=$false;
    scope='Broad sampled public repositories; not an exhaustive list of GitHub or a declaration that all records are open source.';
    repository_count=$repos.Count; repositories=$repos
  }
  $out | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath (Join-Path $inventoryDir 'github-repositories.json') -Encoding utf8
  $repos | Select-Object id,full_name,html_url,description,language,stargazers_count,forks_count,open_issues_count,archived,disabled,fork,created_at,updated_at,pushed_at,default_branch,license_spdx,license_name,license_status,metadata_only,inferred_category,@{n='search_queries';e={$_.search_queries -join ' | '}} | Export-Csv -LiteralPath (Join-Path $inventoryDir 'github-repositories.csv') -NoTypeInformation -Encoding utf8
  [ordered]@{
    checked_at_utc=$stamp; repository_count=$repos.Count; search_plan=$searchPlan; searches=@($searches);
    api_documentation_url='https://docs.github.com/en/rest/search/search#about-search';
    api_documentation_checked_at='2026-11-05';
    license_documentation_url='https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository';
    completeness_limitations=@(
      'GitHub repository search returns at most 1000 results per query; broad avito query is capped and therefore sampled.',
      'Search uses default GitHub best-match relevance, without a frozen snapshot; results can move across pages during collection.',
      'Only public repositories discovered by the listed queries are included; forks, synonyms, private and unindexed projects can be missed.',
      'The catalog includes false positives: interview tasks, clones, Avito.ma, company infrastructure and Kaggle projects.',
      'Metadata and GitHub-detected license were collected; no project was installed or run, and code was not reviewed in this inventory.',
      'Missing license or NOASSERTION is not permission to reuse code; even detected SPDX is metadata, not a full license audit.',
      'An initial GitHub connector probe returned 100 repositories but omitted description, stars, license and total_count; public REST was used for the export.'
    )
  } | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath (Join-Path $inventoryDir 'search-coverage.json') -Encoding utf8
}

foreach ($plan in $searchPlan) {
  for ($page=1; $page -le $plan.pages; $page++) {
    if (@($searches | Where-Object { $_.query -eq $plan.query -and $_.page -eq $page -and $_.status -eq 'ok' }).Count -gt 0) { continue }
    $url='https://api.github.com/search/repositories?q='+[uri]::EscapeDataString($plan.query)+'&per_page=100&page='+$page
    $entry=[ordered]@{ query=$plan.query; page=$page; per_page=100; url=$url; fetched_at_utc=[DateTime]::UtcNow.ToString('o'); status='pending' }
    try {
      $attemptErrors=[System.Collections.Generic.List[string]]::new()
      for ($attempt=1; $attempt -le 3; $attempt++) {
        try {
          $response=Invoke-WebRequest -Uri $url -Headers @{'User-Agent'='Avitolog-course-public-research';'Accept'='application/vnd.github+json';'X-GitHub-Api-Version'='2022-11-28'} -TimeoutSec 45
          break
        } catch {
          $attemptErrors.Add($_.Exception.Message)
          if ($attempt -eq 3) { throw }
          Start-Sleep -Seconds 7
        }
      }
      $entry.attempt_count=$attempt; $entry.transport_errors=@($attemptErrors)
      $data=$response.Content | ConvertFrom-Json
      $entry.status='ok'; $entry.total_count=$data.total_count; $entry.incomplete_results=$data.incomplete_results; $entry.returned_count=@($data.items).Count
      $entry.rate_limit_remaining=[string]$response.Headers['X-RateLimit-Remaining']; $entry.rate_limit_reset=[string]$response.Headers['X-RateLimit-Reset']
      foreach ($repo in $data.items) {
        $repoKey=[string]$repo.id
        if ($repoById.ContainsKey($repoKey)) {
          $existing=$repoById[$repoKey]
          $existing.search_queries=@($existing.search_queries+$plan.query | Select-Object -Unique)
          continue
        }
        $nameText=($repo.full_name+' '+$repo.description).ToLowerInvariant()
        $category='unclassified_metadata'
        if ($repo.owner.login -eq 'avito-tech') {$category='avito_organization_infrastructure_or_training'}
        elseif ($nameText -match 'kaggle|demand.prediction|duplicate') {$category='ml_competition_or_research'}
        elseif ($nameText -match 'trainee|intern|стаж|тестов|test.task|avito.clone|clone.avito') {$category='training_or_clone'}
        elseif ($nameText -match 'mcp') {$category='mcp_integration'}
        elseif ($nameText -match 'extension|расширен|chrome|userscript|tampermonkey') {$category='browser_extension_or_userscript'}
        elseif ($nameText -match 'gpt|chatgpt|\bllm\b|openai|нейро|искусств|\bai\b') {$category='ai_related'}
        elseif ($nameText -match 'monitor|notifier|notification|уведом|монитор|отслеж') {$category='monitoring_or_alerts'}
        elseif ($nameText -match 'parser|парсер|scrap|crawl') {$category='data_extraction'}
        elseif ($nameText -match '\bbot\b|бот') {$category='bot_unspecified'}
        elseif ($nameText -match '\bapi\b|sdk') {$category='api_or_sdk'}
        $spdx=if ($null -ne $repo.license) {$repo.license.spdx_id} else {$null}
        $licenseStatus=if (!$spdx) {'missing_license_metadata'} elseif ($spdx -eq 'NOASSERTION') {'noassertion_review_required'} else {'github_detected_spdx_not_audit'}
        $repoById[$repoKey]=[pscustomobject][ordered]@{
          id=$repo.id; full_name=$repo.full_name; html_url=$repo.html_url; description=$repo.description; language=$repo.language;
          stargazers_count=$repo.stargazers_count; forks_count=$repo.forks_count; open_issues_count=$repo.open_issues_count;
          archived=$repo.archived; disabled=$repo.disabled; fork=$repo.fork; created_at=$repo.created_at; updated_at=$repo.updated_at; pushed_at=$repo.pushed_at;
          default_branch=$repo.default_branch; size_kb=$repo.size; topics=@($repo.topics); homepage=$repo.homepage;
          license_spdx=$spdx; license_name=if($repo.license){$repo.license.name}else{$null}; license_url=if($repo.license){$repo.license.url}else{$null}; license_status=$licenseStatus;
          search_queries=@($plan.query); metadata_fetched_at_utc=$entry.fetched_at_utc; metadata_only=$true; runtime_tested=$false;
          inferred_category=$category; category_method='heuristic on name, description and owner; not code review'
        }
      }
      $searches.Add([pscustomobject]$entry)
      Write-Inventory
      Write-Output ('OK '+$plan.query+' page '+$page+': '+@($data.items).Count+' results; '+$repoById.Count+' unique; total='+$data.total_count)
      if (@($data.items).Count -lt 100) { break }
    } catch {
      $entry.status='error'; $entry.error=$_.Exception.Message; $searches.Add([pscustomobject]$entry); Write-Inventory
      Write-Output ('ERROR '+$plan.query+' page '+$page+': '+$_.Exception.Message)
      break
    }
    Start-Sleep -Seconds 7
  }
  Start-Sleep -Seconds 7
}
Write-Inventory
Write-Output ('DONE '+$repoById.Count+' unique repositories')
