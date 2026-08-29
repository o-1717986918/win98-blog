param(
  [Parameter(Mandatory = $true)][string]$SolverRoot,
  [Parameter(Mandatory = $true)][string]$Zig
)

$ErrorActionPreference = 'Stop'
$SiteRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$SolverRoot = [System.IO.Path]::GetFullPath($SolverRoot)
$OutputDirectory = Join-Path $SiteRoot 'public\solver'
$Output = Join-Path $OutputDirectory 'solver-engine.wasm'

if (-not (Test-Path -LiteralPath $Zig -PathType Leaf)) { throw "Zig compiler not found: $Zig" }
if (-not (Test-Path -LiteralPath (Join-Path $SolverRoot 'include\solver\solver_engine.h') -PathType Leaf)) { throw "Solver source root is invalid: $SolverRoot" }
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$Sources = @(
  'src\facade\solver_api.c',
  'src\bfs\solver_bfs.c',
  'src\context\solver_core_legacy.c',
  'src\board\solver_board.c',
  'src\pairing\box_pairing.c',
  'src\pairing\solver_pairing.c',
  'src\preclear\solver_preclear.c',
  'src\recognition\solver_recog.c',
  'src\recognition\recog_order.c',
  'src\planning\solver_solve.c',
  'src\planning\return_repair.c',
  'src\context\solver_context.c',
  'src\txn\solver_txn.c',
  'src\profiling\solver_profile.c',
  'src\search\solver_state_cache.c',
  'src\search\push_query_cache.c',
  'src\planning\strategy_registry.c',
  'src\path\solver_path.c',
  'src\path\path_metrics.c',
  'src\planning\solution_eval.c'
) | ForEach-Object { Join-Path $SolverRoot $_ }

$Exports = @(
  'solver_web_input','solver_web_input_capacity','solver_web_run','solver_web_error',
  'solver_web_recognition_solved','solver_web_planning_solved','solver_web_recognition_length',
  'solver_web_planning_length','solver_web_recognition_turns','solver_web_planning_turns',
  'solver_web_boxes_total','solver_web_boxes_completed','solver_web_bombs_total',
  'solver_web_bombs_detonated','solver_web_fail_reason','solver_web_elapsed_ms',
  'solver_web_recognition_path','solver_web_planning_path','solver_web_end_map_row',
  'solver_web_end_map_width','solver_web_end_map_height'
)

$Arguments = @('cc','-target','wasm32-wasi','-mexec-model=reactor','-D_WASI_EMULATED_PROCESS_CLOCKS','-O2','-std=c99','-I',(Join-Path $SolverRoot 'include\solver'))
$Arguments += $Sources
$Arguments += (Join-Path $PSScriptRoot 'bridge.c')
$Arguments += @('-lwasi-emulated-process-clocks','-Wl,--no-entry','-Wl,--export-memory','-Wl,--strip-all')
$Arguments += $Exports | ForEach-Object { "-Wl,--export=$_" }
$Arguments += @('-o',$Output)

& $Zig @Arguments
if ($LASTEXITCODE -ne 0) { throw "Zig Wasm build failed with exit code $LASTEXITCODE" }
Get-Item -LiteralPath $Output | Select-Object FullName,Length
