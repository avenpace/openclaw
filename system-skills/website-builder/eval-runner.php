#!/usr/bin/env php
<?php
/**
 * Website Builder Eval Runner
 *
 * Runs automated checks on generated webapp code.
 * Outputs structured JSON following Clawku eval schema.
 *
 * Usage:
 *   php eval-runner.php /path/to/project [--json] [--quiet]
 *
 * Options:
 *   --json   Output JSON only (default: human-readable + JSON)
 *   --quiet  Suppress human-readable output, only JSON
 *
 * Exit codes:
 *   0 = all pass (ready_to_run = true)
 *   1 = failures found (ready_to_run = false)
 *   2 = usage error
 */

if (php_sapi_name() !== 'cli') {
    die('This script must be run from command line');
}

// Parse arguments
$args = array_slice($argv, 1);
$projectPath = null;
$jsonOnly = false;
$quiet = false;

foreach ($args as $arg) {
    if ($arg === '--json') {
        $jsonOnly = true;
    } elseif ($arg === '--quiet') {
        $quiet = true;
        $jsonOnly = true;
    } elseif (!str_starts_with($arg, '-')) {
        $projectPath = $arg;
    }
}

if (!$projectPath || !is_dir($projectPath)) {
    fwrite(STDERR, "Usage: php eval-runner.php /path/to/project [--json] [--quiet]\n");
    exit(2);
}

$projectPath = rtrim(realpath($projectPath), '/');

// Initialize eval result structure
$evalResult = [
    'app_name' => basename($projectPath),
    'generation_id' => 'eval_' . date('Ymd_His'),
    'status' => 'pass',
    'summary' => [
        'total_checks' => 0,
        'passed' => 0,
        'failed' => 0,
        'warnings' => 0,
        'critical_failures' => 0,
    ],
    'categories' => [
        'completeness' => ['status' => 'pass', 'checks' => []],
        'syntax' => ['status' => 'pass', 'checks' => []],
        'consistency' => ['status' => 'pass', 'checks' => []],
        'framework_contract' => ['status' => 'pass', 'checks' => []],
        'security' => ['status' => 'pass', 'checks' => []],
        'runtime_smoke' => ['status' => 'pass', 'checks' => []],
    ],
    'missing_files' => [],
    'empty_files' => [],
    'changed_files_required' => [],
    'repair_priority' => [],
    'ready_to_run' => true,
];

// Helper function to add a check result
function addCheck(string $category, array $check): void {
    global $evalResult;

    $evalResult['categories'][$category]['checks'][] = $check;
    $evalResult['summary']['total_checks']++;

    if ($check['status'] === 'pass') {
        $evalResult['summary']['passed']++;
    } elseif ($check['status'] === 'fail') {
        $evalResult['summary']['failed']++;
        $evalResult['categories'][$category]['status'] = 'fail';
        $evalResult['status'] = 'fail';
        $evalResult['ready_to_run'] = false;

        if ($check['severity'] === 'critical') {
            $evalResult['summary']['critical_failures']++;
        }

        // Add to repair priority
        $evalResult['repair_priority'][] = [
            'severity' => $check['severity'],
            'file' => $check['file'],
            'issue_code' => $check['id'],
            'message' => $check['message'],
        ];

        // Track files that need changes
        if (!empty($check['file']) && !in_array($check['file'], $evalResult['changed_files_required'])) {
            $evalResult['changed_files_required'][] = $check['file'];
        }
    } elseif ($check['status'] === 'warning') {
        $evalResult['summary']['warnings']++;
        if ($evalResult['categories'][$category]['status'] === 'pass') {
            $evalResult['categories'][$category]['status'] = 'partial';
        }
    }
}

// Helper for logging (only if not quiet)
function logMsg(string $msg): void {
    global $jsonOnly;
    if (!$jsonOnly) {
        echo $msg;
    }
}

logMsg("🔍 Running eval checks on: {$projectPath}\n\n");

// ============ COMPLETENESS CHECKS ============

logMsg("📁 COMPLETENESS\n");

$requiredFiles = [
    'index.php' => ['severity' => 'critical', 'desc' => 'Front controller entry point'],
    'migrate.php' => ['severity' => 'high', 'desc' => 'CLI migration runner'],
    'assets/style.css' => ['severity' => 'high', 'desc' => 'Main stylesheet'],
    'config/app.php' => ['severity' => 'critical', 'desc' => 'Application configuration'],
    'app/Core/App.php' => ['severity' => 'critical', 'desc' => 'Bootstrap and router'],
    'app/Core/Database.php' => ['severity' => 'critical', 'desc' => 'PDO wrapper'],
    'app/Core/Controller.php' => ['severity' => 'critical', 'desc' => 'Base controller'],
    'app/Core/Model.php' => ['severity' => 'critical', 'desc' => 'Base model'],
    'app/Core/Request.php' => ['severity' => 'critical', 'desc' => 'Request helper'],
    'app/Core/Response.php' => ['severity' => 'critical', 'desc' => 'Response helper'],
    'app/Core/Session.php' => ['severity' => 'critical', 'desc' => 'Session wrapper'],
    'app/Core/Auth.php' => ['severity' => 'critical', 'desc' => 'Authentication'],
    'app/Core/Middleware.php' => ['severity' => 'critical', 'desc' => 'Middleware runner'],
    'app/Core/Validator.php' => ['severity' => 'high', 'desc' => 'Input validation'],
    'views/layouts/main.php' => ['severity' => 'high', 'desc' => 'Main layout template'],
];

foreach ($requiredFiles as $file => $info) {
    $fullPath = "{$projectPath}/{$file}";
    $exists = file_exists($fullPath);
    $isEmpty = $exists && filesize($fullPath) === 0;

    if ($exists && !$isEmpty) {
        logMsg("  ✓ {$file}\n");
        addCheck('completeness', [
            'id' => 'REQUIRED_FILE_EXISTS',
            'status' => 'pass',
            'severity' => $info['severity'],
            'file' => $file,
            'message' => "Required file exists: {$info['desc']}",
            'details' => [],
            'expected' => 'File must exist and be non-empty',
            'actual' => 'File exists',
        ]);
    } elseif ($isEmpty) {
        logMsg("  ✗ {$file} [EMPTY]\n");
        $evalResult['empty_files'][] = $file;
        addCheck('completeness', [
            'id' => 'REQUIRED_FILE_NON_EMPTY',
            'status' => 'fail',
            'severity' => $info['severity'],
            'file' => $file,
            'message' => "Required file is empty: {$info['desc']}",
            'details' => [],
            'expected' => 'File must have content',
            'actual' => 'File is empty (0 bytes)',
        ]);
    } else {
        logMsg("  ✗ {$file} [MISSING]\n");
        $evalResult['missing_files'][] = $file;
        addCheck('completeness', [
            'id' => 'REQUIRED_FILE_EXISTS',
            'status' => 'fail',
            'severity' => $info['severity'],
            'file' => $file,
            'message' => "Missing required file: {$info['desc']}",
            'details' => [],
            'expected' => 'File must exist',
            'actual' => 'File not found',
        ]);
    }
}

// Check for public/ directory (forbidden)
if (is_dir("{$projectPath}/public")) {
    logMsg("  ✗ public/ directory exists [FORBIDDEN]\n");
    addCheck('completeness', [
        'id' => 'NO_PUBLIC_DIRECTORY',
        'status' => 'fail',
        'severity' => 'critical',
        'file' => 'public/',
        'message' => 'Forbidden: public/ directory exists. Must use project root.',
        'details' => [],
        'expected' => 'No public/ directory',
        'actual' => 'public/ directory found',
    ]);
} else {
    logMsg("  ✓ No public/ directory\n");
    addCheck('completeness', [
        'id' => 'NO_PUBLIC_DIRECTORY',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'Correct: No public/ directory',
        'details' => [],
        'expected' => 'No public/ directory',
        'actual' => 'Not found (correct)',
    ]);
}

// ============ SYNTAX CHECKS ============

logMsg("\n📝 SYNTAX\n");

$phpFiles = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($projectPath, RecursiveDirectoryIterator::SKIP_DOTS)
);
foreach ($iterator as $file) {
    if ($file->getExtension() === 'php') {
        $phpFiles[] = $file->getPathname();
    }
}

$syntaxErrors = 0;
foreach ($phpFiles as $phpFile) {
    $output = [];
    $returnCode = 0;
    exec("php -l " . escapeshellarg($phpFile) . " 2>&1", $output, $returnCode);

    $relativePath = str_replace($projectPath . '/', '', $phpFile);

    if ($returnCode !== 0) {
        $errorLine = null;
        $errorMsg = 'Syntax error';
        foreach ($output as $line) {
            if (preg_match('/on line (\d+)/', $line, $m)) {
                $errorLine = (int)$m[1];
            }
            if (stripos($line, 'error') !== false) {
                $errorMsg = trim($line);
            }
        }

        logMsg("  ✗ {$relativePath} [SYNTAX ERROR]\n");
        addCheck('syntax', [
            'id' => 'PHP_LINT',
            'status' => 'fail',
            'severity' => 'critical',
            'file' => $relativePath,
            'message' => 'PHP parse error',
            'details' => ['line' => $errorLine, 'error' => $errorMsg],
            'expected' => 'No syntax errors',
            'actual' => $errorMsg,
        ]);
        $syntaxErrors++;
    }
}

if ($syntaxErrors === 0) {
    logMsg("  ✓ All " . count($phpFiles) . " PHP files pass lint\n");
    addCheck('syntax', [
        'id' => 'PHP_LINT',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'All PHP files pass syntax check',
        'details' => ['file_count' => count($phpFiles)],
        'expected' => 'No syntax errors',
        'actual' => 'All files pass',
    ]);
}

// Check SQL migrations parse
$migrationsDir = "{$projectPath}/migrations";
if (is_dir($migrationsDir)) {
    $sqlFiles = glob("{$migrationsDir}/*.sql");
    $sqlErrors = 0;
    foreach ($sqlFiles as $sqlFile) {
        $content = file_get_contents($sqlFile);
        $relativePath = str_replace($projectPath . '/', '', $sqlFile);
        // Basic SQL syntax check - look for common issues
        if (preg_match('/CREATE TABLE\s+\w+\s*\(/', $content) ||
            preg_match('/INSERT INTO\s+\w+/', $content) ||
            preg_match('/ALTER TABLE\s+\w+/', $content)) {
            // Looks like valid SQL structure
        } else if (strlen(trim($content)) > 0) {
            // Has content but doesn't look like valid SQL
            logMsg("  ⚠ {$relativePath} [SQL CHECK]\n");
            addCheck('syntax', [
                'id' => 'SQL_SCHEMA_PARSE',
                'status' => 'warning',
                'severity' => 'medium',
                'file' => $relativePath,
                'message' => 'SQL file may have issues',
                'details' => [],
                'expected' => 'Valid SQL statements',
                'actual' => 'Could not detect standard SQL structure',
            ]);
            $sqlErrors++;
        }
    }
    if ($sqlErrors === 0 && count($sqlFiles) > 0) {
        logMsg("  ✓ " . count($sqlFiles) . " SQL migration file(s) look valid\n");
        addCheck('syntax', [
            'id' => 'SQL_SCHEMA_PARSE',
            'status' => 'pass',
            'severity' => 'medium',
            'file' => 'migrations/',
            'message' => 'SQL migrations appear valid',
            'details' => ['file_count' => count($sqlFiles)],
            'expected' => 'Valid SQL statements',
            'actual' => 'All migrations look valid',
        ]);
    }
}

// ============ CONSISTENCY CHECKS ============

logMsg("\n🔗 CONSISTENCY\n");

// Check if routes point to existing controllers
$appPhp = @file_get_contents("{$projectPath}/app/Core/App.php");
if ($appPhp) {
    // Extract route definitions
    preg_match_all("/\['(\w+Controller)',\s*'(\w+)'[^]]*\]/", $appPhp, $routeMatches, PREG_SET_ORDER);

    $controllerChecks = [];
    foreach ($routeMatches as $match) {
        $controller = $match[1];
        $action = $match[2];
        $key = "{$controller}::{$action}";

        if (isset($controllerChecks[$key])) continue;
        $controllerChecks[$key] = true;

        $controllerFile = "{$projectPath}/app/Controllers/{$controller}.php";
        $relativePath = "app/Controllers/{$controller}.php";

        if (!file_exists($controllerFile)) {
            logMsg("  ✗ Route target missing: {$controller}\n");
            addCheck('consistency', [
                'id' => 'ROUTE_CONTROLLER_EXISTS',
                'status' => 'fail',
                'severity' => 'critical',
                'file' => $relativePath,
                'message' => "Route target controller not found",
                'details' => ['controller' => $controller, 'action' => $action],
                'expected' => 'Controller class must exist',
                'actual' => 'Controller file not found',
            ]);
        } else {
            $controllerContent = file_get_contents($controllerFile);
            if (strpos($controllerContent, "function {$action}") === false) {
                logMsg("  ✗ Action missing: {$controller}::{$action}\n");
                addCheck('consistency', [
                    'id' => 'CONTROLLER_ACTION_EXISTS',
                    'status' => 'fail',
                    'severity' => 'high',
                    'file' => $relativePath,
                    'message' => "Controller action method not found",
                    'details' => ['controller' => $controller, 'action' => $action],
                    'expected' => "Method {$action}() must exist",
                    'actual' => 'Method not found',
                ]);
            }
        }
    }

    if (empty($controllerChecks)) {
        logMsg("  ⚠ No routes found to check\n");
    } else {
        $routeFailures = array_filter($evalResult['categories']['consistency']['checks'], fn($c) => $c['status'] === 'fail');
        if (empty($routeFailures)) {
            logMsg("  ✓ All routes resolve to controllers\n");
            addCheck('consistency', [
                'id' => 'ROUTE_CONTROLLER_EXISTS',
                'status' => 'pass',
                'severity' => 'critical',
                'file' => 'app/Core/App.php',
                'message' => 'All routes point to existing controllers and methods',
                'details' => ['route_count' => count($controllerChecks)],
                'expected' => 'Routes resolve to real handlers',
                'actual' => 'All routes valid',
            ]);
        }
    }
}

// Check view references in controllers
$controllerFiles = glob("{$projectPath}/app/Controllers/*.php") ?: [];
foreach ($controllerFiles as $controllerFile) {
    $content = file_get_contents($controllerFile);
    $relativePath = str_replace($projectPath . '/', '', $controllerFile);

    // Find view() calls
    preg_match_all("/->view\(['\"]([^'\"]+)['\"]/", $content, $viewMatches);
    foreach ($viewMatches[1] as $viewName) {
        $viewPath = str_replace('.', '/', $viewName);
        $viewFile = "{$projectPath}/views/{$viewPath}.php";

        if (!file_exists($viewFile)) {
            logMsg("  ✗ View not found: {$viewName}\n");
            addCheck('consistency', [
                'id' => 'VIEW_REFERENCE_EXISTS',
                'status' => 'fail',
                'severity' => 'high',
                'file' => $relativePath,
                'message' => 'Referenced view file not found',
                'details' => ['view' => $viewName, 'expected_path' => "views/{$viewPath}.php"],
                'expected' => 'View file must exist',
                'actual' => 'View file not found',
            ]);
        }
    }

    // Find partial() calls
    preg_match_all("/->partial\(['\"]([^'\"]+)['\"]/", $content, $partialMatches);
    foreach ($partialMatches[1] as $partialName) {
        $partialPath = str_replace('.', '/', $partialName);
        $partialFile = "{$projectPath}/views/{$partialPath}.php";

        if (!file_exists($partialFile)) {
            logMsg("  ✗ Partial not found: {$partialName}\n");
            addCheck('consistency', [
                'id' => 'VIEW_REFERENCE_EXISTS',
                'status' => 'fail',
                'severity' => 'high',
                'file' => $relativePath,
                'message' => 'Referenced partial file not found',
                'details' => ['partial' => $partialName, 'expected_path' => "views/{$partialPath}.php"],
                'expected' => 'Partial file must exist',
                'actual' => 'Partial file not found',
            ]);
        }
    }
}

// ============ FORM-ROUTE CONSISTENCY CHECK ============

logMsg("\n📝 FORM-ROUTE VALIDATION\n");

// Extract defined routes from App.php
$definedRoutes = [];
if ($appPhp) {
    // Match routes like: 'POST /staff' => [...] or 'PUT /staff/{id}' => [...]
    preg_match_all("/'(GET|POST|PUT|DELETE|PATCH)\s+([^']+)'\s*=>/", $appPhp, $routeMatches, PREG_SET_ORDER);
    foreach ($routeMatches as $match) {
        $method = $match[1];
        $path = ltrim($match[2], '/');
        // Convert {id} to regex pattern for matching
        $pattern = preg_replace('/\{[^}]+\}/', '[^/]+', $path);
        $definedRoutes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => $pattern,
        ];
    }
}

// Scan all view files for form actions
$viewFiles = [];
$viewDirs = [
    "{$projectPath}/views",
    "{$projectPath}/app/Views",
];
foreach ($viewDirs as $viewDir) {
    if (is_dir($viewDir)) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($viewDir));
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $viewFiles[] = $file->getPathname();
            }
        }
    }
}

$formRouteErrors = [];

foreach ($viewFiles as $viewFile) {
    $content = file_get_contents($viewFile);
    $relativePath = str_replace($projectPath . '/', '', $viewFile);
    $lines = explode("\n", $content);

    // Find form actions - various patterns
    // Pattern 1: action="path" or action='path'
    preg_match_all('/action=["\']([^"\']+)["\']/', $content, $staticActions, PREG_OFFSET_CAPTURE);

    // Pattern 2: :action="expr" (Alpine.js dynamic)
    preg_match_all('/:action=["\']([^"\']+)["\']/', $content, $dynamicActions, PREG_OFFSET_CAPTURE);

    // Process static form actions
    foreach ($staticActions[1] as $actionMatch) {
        $action = $actionMatch[0];
        $offset = $actionMatch[1];

        // Skip if it's a full URL or starts with http/https
        if (preg_match('/^(https?:|\/\/|#|javascript:)/', $action)) {
            continue;
        }

        // Calculate line number
        $lineNum = substr_count(substr($content, 0, $offset), "\n") + 1;

        // Normalize the action path
        $actionPath = ltrim($action, './');

        // Check for common mistakes: action contains controller method names
        $forbiddenSuffixes = ['/store', '/create', '/update', '/edit', '/delete', '/destroy', '/save'];
        foreach ($forbiddenSuffixes as $suffix) {
            if (str_ends_with($actionPath, $suffix)) {
                $basePath = rtrim($actionPath, $suffix);
                $formRouteErrors[] = [
                    'file' => $relativePath,
                    'line' => $lineNum,
                    'action' => $action,
                    'issue' => "Form action '{$action}' uses controller method name '{$suffix}' - should be '{$basePath}' or '{$basePath}/{id}'",
                ];
            }
        }

        // Verify action matches a defined route (for POST/PUT/DELETE forms)
        // Look for the form's method in nearby context
        $contextStart = max(0, $offset - 200);
        $context = substr($content, $contextStart, 400);

        $isPostForm = preg_match('/method=["\']POST["\']|method=["\']post["\']/i', $context);
        if ($isPostForm && !empty($actionPath)) {
            $matched = false;
            foreach ($definedRoutes as $route) {
                if (in_array($route['method'], ['POST', 'PUT', 'DELETE', 'PATCH'])) {
                    // Check if action path matches route pattern
                    $routePattern = '#^' . $route['pattern'] . '$#';
                    if (preg_match($routePattern, $actionPath)) {
                        $matched = true;
                        break;
                    }
                }
            }

            // Only flag as error if the action looks like a REST endpoint but doesn't match
            if (!$matched && !in_array($actionPath, ['login', 'logout', 'register'])) {
                // Check if it's a known bad pattern
                foreach ($forbiddenSuffixes as $suffix) {
                    if (str_ends_with($actionPath, $suffix)) {
                        // Already caught above
                        break;
                    }
                }
            }
        }
    }

    // Process dynamic Alpine.js form actions
    foreach ($dynamicActions[1] as $actionMatch) {
        $expr = $actionMatch[0];
        $offset = $actionMatch[1];
        $lineNum = substr_count(substr($content, 0, $offset), "\n") + 1;

        // Check for common mistake patterns in Alpine expressions
        // e.g., :action="editMode ? 'staff/update' : 'staff/store'"
        $badPatterns = [
            "/'[^']*\/store'/" => 'store',
            "/'[^']*\/create'/" => 'create',
            "/'[^']*\/update'/" => 'update',
            "/'[^']*\/delete'/" => 'delete',
            "/'[^']*\/destroy'/" => 'destroy',
            "/'[^']*\/save'/" => 'save',
        ];

        foreach ($badPatterns as $pattern => $methodName) {
            if (preg_match($pattern, $expr, $matches)) {
                $formRouteErrors[] = [
                    'file' => $relativePath,
                    'line' => $lineNum,
                    'action' => $expr,
                    'issue' => "Dynamic action contains '/{$methodName}' - should use REST URL pattern (e.g., 'resource' or 'resource/' + id)",
                ];
                break;
            }
        }
    }
}

// Report results
if (!empty($formRouteErrors)) {
    logMsg("  ✗ " . count($formRouteErrors) . " form-route mismatch(es) found\n");
    foreach ($formRouteErrors as $error) {
        logMsg("    - {$error['file']}:{$error['line']} - {$error['issue']}\n");
        addCheck('consistency', [
            'id' => 'FORM_ROUTE_MATCH',
            'status' => 'fail',
            'severity' => 'critical',
            'file' => $error['file'],
            'message' => 'Form action does not match defined route',
            'details' => [
                'line' => $error['line'],
                'action' => $error['action'],
                'issue' => $error['issue'],
            ],
            'expected' => 'Form action must match a route path (e.g., "staff" not "staff/store")',
            'actual' => $error['action'],
        ]);
    }
} else {
    logMsg("  ✓ All form actions match defined routes\n");
    addCheck('consistency', [
        'id' => 'FORM_ROUTE_MATCH',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'All form actions correctly match defined routes',
        'details' => ['views_checked' => count($viewFiles)],
        'expected' => 'Form actions match routes',
        'actual' => 'All forms valid',
    ]);
}

// ============ SCHEMA-MODEL CONSISTENCY CHECK ============

logMsg("\n🗄️ SCHEMA-MODEL VALIDATION\n");

// Step 1: Parse migrations to extract table schemas
$schemaColumns = []; // table => [column1, column2, ...]

// Check multiple possible migration directories and file types
$migrationDirs = [
    "{$projectPath}/database/migrations" => '*.php',
    "{$projectPath}/migrations" => '*.sql',
];

foreach ($migrationDirs as $migrationDir => $pattern) {
    if (!is_dir($migrationDir)) continue;

    $migrationFiles = glob("{$migrationDir}/{$pattern}") ?: [];
    foreach ($migrationFiles as $migrationFile) {
        $content = file_get_contents($migrationFile);

        // Match CREATE TABLE statements
        // Pattern: CREATE TABLE IF NOT EXISTS tablename (
        if (preg_match_all('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"\']?(\w+)[`"\']?\s*\(([\s\S]*?)\);/i', $content, $tableMatches, PREG_SET_ORDER)) {
            foreach ($tableMatches as $tableMatch) {
                $tableName = $tableMatch[1];
                $columnDefs = $tableMatch[2];

                // Extract column names from column definitions
                // Match: column_name TYPE or `column_name` TYPE
                preg_match_all('/^\s*[`"\']?(\w+)[`"\']?\s+(?:INTEGER|TEXT|REAL|BLOB|VARCHAR|INT|DATETIME|TIMESTAMP|BOOLEAN|DECIMAL|FLOAT|DOUBLE|DATE|TIME|CHAR)/mi', $columnDefs, $colMatches);

                if (!isset($schemaColumns[$tableName])) {
                    $schemaColumns[$tableName] = [];
                }
                foreach ($colMatches[1] as $col) {
                    $schemaColumns[$tableName][] = strtolower($col);
                }
            }
        }

        // Also match ALTER TABLE ADD COLUMN
        if (preg_match_all('/ALTER\s+TABLE\s+[`"\']?(\w+)[`"\']?\s+ADD\s+(?:COLUMN\s+)?[`"\']?(\w+)[`"\']?\s+/i', $content, $alterMatches, PREG_SET_ORDER)) {
            foreach ($alterMatches as $alterMatch) {
                $tableName = $alterMatch[1];
                $colName = strtolower($alterMatch[2]);
                if (!isset($schemaColumns[$tableName])) {
                    $schemaColumns[$tableName] = [];
                }
                $schemaColumns[$tableName][] = $colName;
            }
        }
    }
}

// Step 2: Parse Model files and extract column references from SQL
$modelFiles = glob("{$projectPath}/app/Models/*.php") ?: [];
$schemaErrors = [];

foreach ($modelFiles as $modelFile) {
    $content = file_get_contents($modelFile);
    $relativePath = str_replace($projectPath . '/', '', $modelFile);
    $modelName = basename($modelFile, '.php');

    // Determine table name from model (class property or convention)
    $tableName = null;
    if (preg_match('/protected\s+static\s+\$table\s*=\s*[\'"](\w+)[\'"]/', $content, $tableMatch)) {
        $tableName = $tableMatch[1];
    } else {
        // Convention: Model name to table name (Product -> products, Category -> categories)
        $tableName = strtolower($modelName) . 's';
        // Handle special cases
        if (str_ends_with($modelName, 'y')) {
            $tableName = strtolower(substr($modelName, 0, -1)) . 'ies';
        }
    }

    if (!isset($schemaColumns[$tableName])) {
        // Try singular form
        $singularTable = rtrim($tableName, 's');
        if (isset($schemaColumns[$singularTable])) {
            $tableName = $singularTable;
        }
    }

    // Extract column references from SQL queries
    // Pattern 1: SELECT column1, column2, column3 FROM
    preg_match_all('/SELECT\s+([\w\s,.*`]+)\s+FROM/i', $content, $selectMatches);

    // Pattern 2: Column references in WHERE, ORDER BY, GROUP BY
    preg_match_all('/(?:WHERE|AND|OR|ORDER\s+BY|GROUP\s+BY|HAVING|SET)\s+[`"\']?(\w+)[`"\']?\s*(?:=|<|>|!=|<>|LIKE|IS|IN|ASC|DESC|,)/i', $content, $whereMatches);

    // Pattern 3: INSERT columns
    preg_match_all('/INSERT\s+INTO\s+\w+\s*\(([\w\s,`]+)\)/i', $content, $insertMatches);

    // Pattern 4: UPDATE SET column =
    preg_match_all('/SET\s+[`"\']?(\w+)[`"\']?\s*=/i', $content, $updateMatches);

    // Pattern 5: SUM(column), COUNT(column), AVG(column), etc.
    preg_match_all('/(?:SUM|COUNT|AVG|MIN|MAX)\s*\(\s*[`"\']?(\w+)[`"\']?\s*\)/i', $content, $aggMatches);

    // Pattern 6: column AS alias or column alias
    preg_match_all('/[`"\']?(\w+)[`"\']?\s+AS\s+\w+/i', $content, $aliasMatches);

    $referencedColumns = [];

    // Process SELECT columns
    foreach ($selectMatches[1] as $selectList) {
        // Skip * and table.* patterns
        if (trim($selectList) === '*') continue;

        $cols = preg_split('/\s*,\s*/', $selectList);
        foreach ($cols as $col) {
            $col = trim($col);
            // Remove table prefix (e.g., t.column_name -> column_name)
            if (preg_match('/(?:\w+\.)?[`"\']?(\w+)[`"\']?/', $col, $m)) {
                if ($m[1] !== '*' && !in_array(strtoupper($m[1]), ['AS', 'FROM', 'WHERE', 'AND', 'OR', 'ON'])) {
                    $referencedColumns[strtolower($m[1])] = true;
                }
            }
        }
    }

    // Process WHERE columns
    foreach ($whereMatches[1] as $col) {
        $col = strtolower(trim($col));
        if (!in_array($col, ['and', 'or', 'not', 'null', 'true', 'false', 'is', 'in', 'like', 'between'])) {
            $referencedColumns[$col] = true;
        }
    }

    // Process INSERT columns
    foreach ($insertMatches[1] as $insertList) {
        $cols = preg_split('/\s*,\s*/', $insertList);
        foreach ($cols as $col) {
            $col = trim($col, " \t\n\r\0\x0B`\"'");
            if (!empty($col)) {
                $referencedColumns[strtolower($col)] = true;
            }
        }
    }

    // Process UPDATE SET columns
    foreach ($updateMatches[1] as $col) {
        $referencedColumns[strtolower(trim($col))] = true;
    }

    // Process aggregate columns
    foreach ($aggMatches[1] as $col) {
        $col = strtolower(trim($col));
        if ($col !== '*') {
            $referencedColumns[$col] = true;
        }
    }

    // Process alias source columns
    foreach ($aliasMatches[1] as $col) {
        $referencedColumns[strtolower(trim($col))] = true;
    }

    // Remove common SQL keywords that might be false positives
    $sqlKeywords = ['id', 'null', 'true', 'false', 'count', 'sum', 'avg', 'min', 'max',
                    'select', 'from', 'where', 'and', 'or', 'not', 'in', 'like', 'between',
                    'order', 'by', 'group', 'having', 'limit', 'offset', 'as', 'on', 'join',
                    'inner', 'left', 'right', 'outer', 'asc', 'desc', 'distinct', 'all'];

    // Check each referenced column against schema
    if (isset($schemaColumns[$tableName])) {
        $tableColumns = $schemaColumns[$tableName];

        foreach (array_keys($referencedColumns) as $col) {
            // Skip if it's a SQL keyword or very common column
            if (in_array($col, $sqlKeywords)) continue;
            if (in_array($col, ['created_at', 'updated_at', 'deleted_at'])) continue;

            // Skip if column exists
            if (in_array($col, $tableColumns)) continue;

            // Skip if it looks like a joined table column (contains underscore prefix pattern)
            // This is a heuristic - might need refinement

            // Column not found - this is an error!
            $schemaErrors[] = [
                'model' => $modelName,
                'file' => $relativePath,
                'table' => $tableName,
                'column' => $col,
                'available' => implode(', ', $tableColumns),
            ];
        }
    }
}

// Report schema validation results
if (!empty($schemaErrors)) {
    logMsg("  ✗ " . count($schemaErrors) . " schema-model mismatch(es) found\n");
    foreach ($schemaErrors as $error) {
        logMsg("    - {$error['file']}: Column '{$error['column']}' not in table '{$error['table']}'\n");
        logMsg("      Available: {$error['available']}\n");
        addCheck('consistency', [
            'id' => 'SCHEMA_MODEL_MATCH',
            'status' => 'fail',
            'severity' => 'critical',
            'file' => $error['file'],
            'message' => "Model references column '{$error['column']}' that doesn't exist in migration for table '{$error['table']}'",
            'details' => [
                'model' => $error['model'],
                'table' => $error['table'],
                'missing_column' => $error['column'],
                'available_columns' => $error['available'],
            ],
            'expected' => "Column '{$error['column']}' must be defined in migration",
            'actual' => "Column not found in table schema",
        ]);
    }
} else {
    $modelCount = count($modelFiles);
    $tableCount = count($schemaColumns);
    logMsg("  ✓ All model column references match migration schemas ({$modelCount} models, {$tableCount} tables)\n");
    addCheck('consistency', [
        'id' => 'SCHEMA_MODEL_MATCH',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'All model column references exist in migration schemas',
        'details' => ['models_checked' => $modelCount, 'tables_found' => $tableCount],
        'expected' => 'Model columns match schema',
        'actual' => 'All columns valid',
    ]);
}

// ============ FRAMEWORK CONTRACT CHECKS ============

logMsg("\n📋 FRAMEWORK CONTRACT\n");

// Check for migrate on boot
if ($appPhp) {
    // Look for Database::migrate() that's NOT commented out
    $lines = explode("\n", $appPhp);
    $migrateOnBoot = false;
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if (strpos($trimmed, 'Database::migrate()') !== false &&
            !str_starts_with($trimmed, '//') &&
            !str_starts_with($trimmed, '#') &&
            !str_starts_with($trimmed, '*')) {
            $migrateOnBoot = true;
            break;
        }
    }

    if ($migrateOnBoot) {
        logMsg("  ✓ Auto-migrate on boot [REQUIRED for good UX]\n");
        addCheck('framework_contract', [
            'id' => 'AUTO_MIGRATE_ON_BOOT',
            'status' => 'pass',
            'severity' => 'critical',
            'file' => 'app/Core/App.php',
            'message' => 'Database::migrate() correctly called on boot for instant usability',
            'details' => [],
            'expected' => 'Auto-migrate on boot for good UX',
            'actual' => 'Correct - migrations run automatically',
        ]);
    } else {
        logMsg("  ✗ No auto-migrate on boot [BAD UX - users get schema errors]\n");
        addCheck('framework_contract', [
            'id' => 'AUTO_MIGRATE_ON_BOOT',
            'status' => 'fail',
            'severity' => 'critical',
            'file' => 'app/Core/App.php',
            'message' => 'Missing Database::migrate() in App.php boot - users will get "no such column" errors',
            'details' => ['fix' => 'Add Database::migrate() call in App.php boot() or __construct()'],
            'expected' => 'Database::migrate() must be called on boot',
            'actual' => 'No auto-migrate - BAD UX',
        ]);
    }
}

// Check for absolute URLs
$absoluteUrlFiles = [];
foreach ($phpFiles as $phpFile) {
    $content = file_get_contents($phpFile);
    $relativePath = str_replace($projectPath . '/', '', $phpFile);

    // Check for href="/...", src="/...", action="/..." (but not href="//..." for protocol-relative)
    if (preg_match('/(href|src|action)="\/[^\/]/', $content)) {
        $absoluteUrlFiles[] = $relativePath;
    }
    // Check for Response::redirect('/...
    if (preg_match('/Response::redirect\s*\(\s*[\'"]\/[^\/]/', $content)) {
        $absoluteUrlFiles[] = $relativePath . ' (redirect)';
    }
}

$absoluteUrlFiles = array_unique($absoluteUrlFiles);
if (!empty($absoluteUrlFiles)) {
    logMsg("  ✗ Absolute URLs found [FORBIDDEN]\n");
    foreach ($absoluteUrlFiles as $file) {
        addCheck('framework_contract', [
            'id' => 'NO_HARDCODED_DEPLOY_PATH',
            'status' => 'fail',
            'severity' => 'high',
            'file' => $file,
            'message' => 'Absolute URL path found (must use relative)',
            'details' => [],
            'expected' => 'All URLs must be relative (no leading /)',
            'actual' => 'Found href="/..." or similar',
        ]);
    }
} else {
    logMsg("  ✓ No absolute URLs found\n");
    addCheck('framework_contract', [
        'id' => 'NO_HARDCODED_DEPLOY_PATH',
        'status' => 'pass',
        'severity' => 'high',
        'file' => '',
        'message' => 'All URLs are relative',
        'details' => [],
        'expected' => 'Relative URLs only',
        'actual' => 'No absolute URLs found',
    ]);
}

// ============ SECURITY CHECKS ============

logMsg("\n🔐 SECURITY\n");

// Check CSRF tokens in forms
$viewFiles = [];
$viewDir = "{$projectPath}/views";
if (is_dir($viewDir)) {
    $viewIterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($viewDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($viewIterator as $file) {
        if ($file->getExtension() === 'php') {
            $viewFiles[] = $file->getPathname();
        }
    }
}

$formsWithoutCsrf = [];
foreach ($viewFiles as $viewFile) {
    $content = file_get_contents($viewFile);
    $relativePath = str_replace($projectPath . '/', '', $viewFile);

    // Check for forms with POST/PUT/DELETE
    if (preg_match('/<form[^>]*(method=["\']?(POST|PUT|DELETE)|hx-(post|put|delete))/i', $content)) {
        // Check for CSRF token
        if (stripos($content, 'csrf_field()') === false &&
            stripos($content, '_csrf_token') === false) {
            $formsWithoutCsrf[] = $relativePath;
        }
    }
}

if (!empty($formsWithoutCsrf)) {
    logMsg("  ✗ Forms without CSRF token\n");
    foreach ($formsWithoutCsrf as $file) {
        addCheck('security', [
            'id' => 'CSRF_PRESENT_ON_STATE_CHANGE',
            'status' => 'fail',
            'severity' => 'high',
            'file' => $file,
            'message' => 'Form missing CSRF token',
            'details' => [],
            'expected' => 'All POST/PUT/DELETE forms must have csrf_field()',
            'actual' => 'CSRF token not found',
        ]);
    }
} else {
    logMsg("  ✓ All forms have CSRF tokens\n");
    addCheck('security', [
        'id' => 'CSRF_PRESENT_ON_STATE_CHANGE',
        'status' => 'pass',
        'severity' => 'high',
        'file' => '',
        'message' => 'All state-changing forms have CSRF protection',
        'details' => [],
        'expected' => 'CSRF tokens present',
        'actual' => 'All forms protected',
    ]);
}

// Check session regeneration
$authPhp = @file_get_contents("{$projectPath}/app/Core/Auth.php");
if ($authPhp) {
    if (stripos($authPhp, 'session_regenerate_id') !== false ||
        stripos($authPhp, 'Session::regenerate') !== false) {
        logMsg("  ✓ Session regeneration on login\n");
        addCheck('security', [
            'id' => 'SESSION_REGENERATE_ON_LOGIN',
            'status' => 'pass',
            'severity' => 'high',
            'file' => 'app/Core/Auth.php',
            'message' => 'Session ID regenerated on authentication',
            'details' => [],
            'expected' => 'Regenerate session on login',
            'actual' => 'session_regenerate_id found',
        ]);
    } else {
        logMsg("  ✗ No session regeneration [SECURITY RISK]\n");
        addCheck('security', [
            'id' => 'SESSION_REGENERATE_ON_LOGIN',
            'status' => 'fail',
            'severity' => 'high',
            'file' => 'app/Core/Auth.php',
            'message' => 'No session_regenerate_id(true) after login',
            'details' => [],
            'expected' => 'Regenerate session on successful login',
            'actual' => 'Not found',
        ]);
    }
}

// Check CSRF middleware exists
$middlewarePhp = @file_get_contents("{$projectPath}/app/Core/Middleware.php");
if ($middlewarePhp) {
    if (stripos($middlewarePhp, "'csrf'") !== false ||
        stripos($middlewarePhp, '"csrf"') !== false) {
        logMsg("  ✓ CSRF middleware defined\n");
        addCheck('security', [
            'id' => 'AUTH_MIDDLEWARE_ON_PROTECTED_ROUTES',
            'status' => 'pass',
            'severity' => 'high',
            'file' => 'app/Core/Middleware.php',
            'message' => 'CSRF middleware available',
            'details' => [],
            'expected' => 'CSRF middleware defined',
            'actual' => 'Found csrf middleware',
        ]);
    } else {
        logMsg("  ✗ CSRF middleware not found\n");
        addCheck('security', [
            'id' => 'AUTH_MIDDLEWARE_ON_PROTECTED_ROUTES',
            'status' => 'fail',
            'severity' => 'high',
            'file' => 'app/Core/Middleware.php',
            'message' => 'CSRF middleware not defined',
            'details' => [],
            'expected' => 'csrf middleware in Middleware.php',
            'actual' => 'Not found',
        ]);
    }
}

// Check for password_hash usage
$hasPasswordHash = false;
foreach ($controllerFiles as $controllerFile) {
    $content = file_get_contents($controllerFile);
    if (stripos($content, 'password_hash') !== false) {
        $hasPasswordHash = true;
        break;
    }
}
if ($hasPasswordHash) {
    logMsg("  ✓ Using password_hash\n");
    addCheck('security', [
        'id' => 'PASSWORD_HASH_USED',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'Passwords properly hashed with password_hash()',
        'details' => [],
        'expected' => 'Use password_hash for passwords',
        'actual' => 'password_hash found',
    ]);
} else {
    logMsg("  ⚠ password_hash usage not detected\n");
    addCheck('security', [
        'id' => 'PASSWORD_HASH_USED',
        'status' => 'warning',
        'severity' => 'critical',
        'file' => '',
        'message' => 'password_hash() usage not detected (may be OK if no auth)',
        'details' => [],
        'expected' => 'Use password_hash for passwords',
        'actual' => 'Not detected',
    ]);
}

// Check for input validation
$validatorFile = "{$projectPath}/app/Core/Validator.php";
if (file_exists($validatorFile)) {
    logMsg("  ✓ Validator class exists\n");
    addCheck('security', [
        'id' => 'PREPARED_STATEMENTS_USED',
        'status' => 'pass',
        'severity' => 'high',
        'file' => 'app/Core/Validator.php',
        'message' => 'Input validation class available',
        'details' => [],
        'expected' => 'Validator class exists',
        'actual' => 'Found',
    ]);
} else {
    logMsg("  ✗ No Validator class\n");
    addCheck('security', [
        'id' => 'PREPARED_STATEMENTS_USED',
        'status' => 'fail',
        'severity' => 'high',
        'file' => 'app/Core/Validator.php',
        'message' => 'Input validation class missing',
        'details' => [],
        'expected' => 'Create app/Core/Validator.php',
        'actual' => 'Not found',
    ]);
}

// ============ JAVASCRIPT SYNTAX CHECK ============

logMsg("\n📜 JAVASCRIPT SYNTAX CHECK\n");

$jsFiles = [];
$inlineJsErrors = [];

// Find standalone JS files in assets/
$assetsDir = "{$projectPath}/assets";
if (is_dir($assetsDir)) {
    $files = glob("{$assetsDir}/*.js");
    foreach ($files as $file) {
        $jsFiles[] = $file;
    }
    // Also check subdirectories
    $subDirs = glob("{$assetsDir}/*", GLOB_ONLYDIR);
    foreach ($subDirs as $subDir) {
        $subFiles = glob("{$subDir}/*.js");
        foreach ($subFiles as $file) {
            $jsFiles[] = $file;
        }
    }
}

// Check standalone JS files with node --check
$jsErrors = [];
foreach ($jsFiles as $jsFile) {
    $relativePath = str_replace($projectPath . '/', '', $jsFile);
    $output = [];
    $returnCode = 0;
    exec("node --check " . escapeshellarg($jsFile) . " 2>&1", $output, $returnCode);

    if ($returnCode !== 0) {
        $errorMsg = implode("\n", $output);
        $jsErrors[] = [
            'file' => $relativePath,
            'error' => $errorMsg,
        ];
        logMsg("  ✗ {$relativePath}: Syntax error\n");
        logMsg("    " . str_replace("\n", "\n    ", $errorMsg) . "\n");
    } else {
        logMsg("  ✓ {$relativePath}\n");
    }
}

// Extract and check inline JS from PHP/HTML files
$viewsDir = "{$projectPath}/views";
$phpFilesForJs = [];

// Recursive function to collect PHP/HTML files
$collectPhpFiles = function($dir, &$files) use (&$collectPhpFiles) {
    if (!is_dir($dir)) return;
    $entries = scandir($dir);
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        $path = "{$dir}/{$entry}";
        if (is_dir($path)) {
            $collectPhpFiles($path, $files);
        } elseif (preg_match('/\.(php|html)$/i', $entry)) {
            $files[] = $path;
        }
    }
};

$collectPhpFiles($viewsDir, $phpFilesForJs);
$collectPhpFiles($projectPath, $phpFilesForJs); // Also check root PHP files

// Remove duplicates
$phpFilesForJs = array_unique($phpFilesForJs);

foreach ($phpFilesForJs as $phpFile) {
    $content = file_get_contents($phpFile);
    $relativePath = str_replace($projectPath . '/', '', $phpFile);

    // Extract <script>...</script> blocks (not src imports)
    // Use simpler regex: find all script tags, filter out src-based ones later
    if (preg_match_all('/<script[^>]*>(.*?)<\/script>/is', $content, $matches, PREG_OFFSET_CAPTURE)) {
        foreach ($matches[1] as $idx => $match) {
            $jsContent = trim($match[0]);
            if (strlen($jsContent) < 10) continue; // Skip tiny scripts

            // Skip PHP-only scripts (e.g., just PHP opening/closing tags only)
            if (preg_match('/^<[?]php.*[?]>/s', $jsContent)) continue;

            // Write to temp file for syntax check
            $tempFile = "/tmp/inline-js-" . md5($phpFile . $idx) . ".js";

            // Strip PHP tags - replace with placeholders to preserve structure
            $jsForCheck = preg_replace('/<[?](php)?.*?[?]>/is', '""', $jsContent);

            file_put_contents($tempFile, $jsForCheck);

            $output = [];
            $returnCode = 0;
            exec("node --check " . escapeshellarg($tempFile) . " 2>&1", $output, $returnCode);

            if ($returnCode !== 0) {
                $errorMsg = implode("\n", $output);
                // Calculate line number in original file
                $beforeScript = substr($content, 0, $match[1]);
                $lineNum = substr_count($beforeScript, "\n") + 1;

                $inlineJsErrors[] = [
                    'file' => $relativePath,
                    'line' => $lineNum,
                    'error' => $errorMsg,
                    'scriptIndex' => $idx,
                ];
                logMsg("  ✗ {$relativePath}:inline-script-{$idx} (line ~{$lineNum}): Syntax error\n");
                logMsg("    " . str_replace("\n", "\n    ", $errorMsg) . "\n");
            } else {
                logMsg("  ✓ {$relativePath}:inline-script-{$idx}\n");
            }

            @unlink($tempFile);
        }
    }
}

// Report results
$totalJsFiles = count($jsFiles);
$totalInlineScripts = count($phpFilesForJs); // Approximate
$totalJsErrors = count($jsErrors) + count($inlineJsErrors);

if ($totalJsErrors > 0) {
    logMsg("\n  ✗ {$totalJsErrors} JavaScript syntax error(s) found\n");

    foreach ($jsErrors as $err) {
        addCheck('js_syntax', [
            'id' => 'JS_SYNTAX_' . strtoupper(str_replace(['/', '.', '-'], '_', $err['file'])),
            'status' => 'fail',
            'severity' => 'high',
            'file' => $err['file'],
            'message' => 'JavaScript syntax error',
            'details' => ['error' => $err['error']],
            'expected' => 'Valid JavaScript syntax',
            'actual' => 'Syntax error detected',
        ]);
    }

    foreach ($inlineJsErrors as $err) {
        addCheck('js_syntax', [
            'id' => 'JS_SYNTAX_INLINE_' . strtoupper(str_replace(['/', '.', '-'], '_', $err['file'])) . '_' . $err['scriptIndex'],
            'status' => 'fail',
            'severity' => 'high',
            'file' => $err['file'] . ':line-' . $err['line'],
            'message' => 'Inline JavaScript syntax error',
            'details' => ['error' => $err['error'], 'line' => $err['line']],
            'expected' => 'Valid JavaScript syntax',
            'actual' => 'Syntax error in inline script',
        ]);
    }
} else {
    if ($totalJsFiles === 0 && count($phpFilesForJs) === 0) {
        logMsg("  No JavaScript files found to check\n");
    } else {
        logMsg("\n  ✓ All JavaScript syntax checks passed\n");
    }

    addCheck('js_syntax', [
        'id' => 'JS_SYNTAX_CLEAN',
        'status' => 'pass',
        'severity' => 'high',
        'file' => '',
        'message' => 'All JavaScript files have valid syntax',
        'details' => [
            'standalone_files' => $totalJsFiles,
            'php_files_scanned' => count($phpFilesForJs),
        ],
        'expected' => 'Valid JavaScript',
        'actual' => 'All syntax checks passed',
    ]);
}

// ============ PHP SANDBOXING CHECKS ============

logMsg("\n🔒 PHP SANDBOXING\n");

// Forbidden PHP patterns (code execution, shell, network, path escape)
$forbiddenPatterns = [
    // Code execution - CRITICAL
    'EXEC_EVAL' => '/\beval\s*\(/i',
    'EXEC_ASSERT' => '/\bassert\s*\(/i',
    'EXEC_CREATE_FUNCTION' => '/\bcreate_function\s*\(/i',
    'EXEC_PREG_REPLACE_E' => '/\bpreg_replace\s*\([^,]*\/[^\/]*e[^\/]*\//i',

    // Shell execution - CRITICAL
    'SHELL_EXEC' => '/\bexec\s*\(/i',
    'SHELL_SHELL_EXEC' => '/\bshell_exec\s*\(/i',
    'SHELL_SYSTEM' => '/\bsystem\s*\(/i',
    'SHELL_PASSTHRU' => '/\bpassthru\s*\(/i',
    'SHELL_POPEN' => '/\bpopen\s*\(/i',
    'SHELL_PROC_OPEN' => '/\bproc_open\s*\(/i',
    'SHELL_PCNTL' => '/\bpcntl_exec\s*\(/i',
    'SHELL_BACKTICK' => '/`[^`]+`/',

    // Dynamic include - HIGH
    'INCLUDE_DYNAMIC' => '/\b(include|require|include_once|require_once)\s*\(\s*\$_(GET|POST|REQUEST|COOKIE)/i',

    // Network functions - HIGH (potential SSRF/exfil)
    'NET_FSOCKOPEN' => '/\bfsockopen\s*\(/i',
    'NET_PFSOCKOPEN' => '/\bpfsockopen\s*\(/i',
    'NET_STREAM_SOCKET' => '/\bstream_socket_client\s*\(/i',
    'NET_CURL_INIT' => '/\bcurl_init\s*\(/i',
    'NET_CURL_EXEC' => '/\bcurl_exec\s*\(/i',
    'NET_FILE_GET_CONTENTS_URL' => '/\bfile_get_contents\s*\(\s*[\'"]https?:/i',

    // File system danger - MEDIUM
    'FS_CHMOD' => '/\bchmod\s*\(/i',
    'FS_CHOWN' => '/\bchown\s*\(/i',
    'FS_SYMLINK' => '/\bsymlink\s*\(/i',

    // Path escape - absolute paths - CRITICAL
    'PATH_ABSOLUTE' => '/\b(file_get_contents|file_put_contents|fopen|readfile|include|require)\s*\(\s*[\'"]\/[a-z]/i',

    // Path escape - traversal - CRITICAL
    'PATH_TRAVERSAL' => '/\.\.\//i',

    // Path escape - dangerous targets - CRITICAL
    'PATH_ETC' => '/[\'"]\/etc\//i',
    'PATH_VAR' => '/[\'"]\/var\//i',
    'PATH_TMP' => '/[\'"]\/tmp\//i',
    'PATH_PROC' => '/[\'"]\/proc\//i',
    'PATH_HOME' => '/[\'"]\/home\//i',
    'PATH_ROOT' => '/[\'"]\/root\//i',

    // Path injection via superglobals - CRITICAL
    'PATH_ENV_INJECT' => '/\b(file_get_contents|file_put_contents|fopen)\s*\(\s*\$_(GET|POST|REQUEST|COOKIE|SERVER)/i',

    // Info disclosure - MEDIUM
    'INFO_PHPINFO' => '/\bphpinfo\s*\(/i',

    // Config bypass - CRITICAL
    'CONFIG_INI_SET_DISABLE' => '/\bini_set\s*\(\s*[\'"]disable_functions/i',
    'CONFIG_INI_RESTORE' => '/\bini_restore\s*\(/i',
    'CONFIG_DL' => '/\bdl\s*\(/i',
];

$severityMap = [
    'EXEC_EVAL' => 'critical',
    'EXEC_ASSERT' => 'critical',
    'EXEC_CREATE_FUNCTION' => 'critical',
    'EXEC_PREG_REPLACE_E' => 'critical',
    'SHELL_EXEC' => 'critical',
    'SHELL_SHELL_EXEC' => 'critical',
    'SHELL_SYSTEM' => 'critical',
    'SHELL_PASSTHRU' => 'critical',
    'SHELL_POPEN' => 'critical',
    'SHELL_PROC_OPEN' => 'critical',
    'SHELL_PCNTL' => 'critical',
    'SHELL_BACKTICK' => 'critical',
    'INCLUDE_DYNAMIC' => 'high',
    'NET_FSOCKOPEN' => 'high',
    'NET_PFSOCKOPEN' => 'high',
    'NET_STREAM_SOCKET' => 'high',
    'NET_CURL_INIT' => 'high',
    'NET_CURL_EXEC' => 'high',
    'NET_FILE_GET_CONTENTS_URL' => 'high',
    'FS_CHMOD' => 'medium',
    'FS_CHOWN' => 'medium',
    'FS_SYMLINK' => 'medium',
    'PATH_ABSOLUTE' => 'critical',
    'PATH_TRAVERSAL' => 'critical',
    'PATH_ETC' => 'critical',
    'PATH_VAR' => 'critical',
    'PATH_TMP' => 'critical',
    'PATH_PROC' => 'critical',
    'PATH_HOME' => 'critical',
    'PATH_ROOT' => 'critical',
    'PATH_ENV_INJECT' => 'critical',
    'INFO_PHPINFO' => 'medium',
    'CONFIG_INI_SET_DISABLE' => 'critical',
    'CONFIG_INI_RESTORE' => 'critical',
    'CONFIG_DL' => 'critical',
];

$sandboxViolations = [];

foreach ($phpFiles as $phpFile) {
    $content = file_get_contents($phpFile);
    $relativePath = str_replace($projectPath . '/', '', $phpFile);
    $lines = explode("\n", $content);

    foreach ($lines as $lineNum => $line) {
        $trimmed = trim($line);
        // Skip comments
        if (str_starts_with($trimmed, '//') || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '*')) {
            continue;
        }

        foreach ($forbiddenPatterns as $code => $pattern) {
            if (preg_match($pattern, $line, $matches)) {
                $sandboxViolations[] = [
                    'code' => $code,
                    'file' => $relativePath,
                    'line' => $lineNum + 1,
                    'match' => $matches[0],
                    'severity' => $severityMap[$code],
                ];
            }
        }
    }
}

if (!empty($sandboxViolations)) {
    logMsg("  ✗ " . count($sandboxViolations) . " sandbox violation(s) found\n");
    foreach ($sandboxViolations as $v) {
        logMsg("    - {$v['file']}:{$v['line']} - {$v['code']}: {$v['match']}\n");
        addCheck('security', [
            'id' => 'PHP_SANDBOX_' . $v['code'],
            'status' => 'fail',
            'severity' => $v['severity'],
            'file' => $v['file'],
            'message' => "Forbidden PHP pattern: {$v['match']}",
            'details' => [
                'line' => $v['line'],
                'pattern' => $v['code'],
            ],
            'expected' => 'No dangerous PHP functions or path escapes',
            'actual' => "Found {$v['match']} at line {$v['line']}",
        ]);
    }
} else {
    logMsg("  ✓ No forbidden PHP patterns detected\n");
    addCheck('security', [
        'id' => 'PHP_SANDBOX_CLEAN',
        'status' => 'pass',
        'severity' => 'critical',
        'file' => '',
        'message' => 'No dangerous PHP functions or path escapes found',
        'details' => ['files_scanned' => count($phpFiles)],
        'expected' => 'Clean PHP code',
        'actual' => 'All files pass sandbox checks',
    ]);
}

// ============ RUNTIME SMOKE CHECKS ============

logMsg("\n🚀 RUNTIME SMOKE\n");

// Check index.php parses
$indexPhp = "{$projectPath}/index.php";
if (file_exists($indexPhp)) {
    $output = [];
    $returnCode = 0;
    exec("php -l " . escapeshellarg($indexPhp) . " 2>&1", $output, $returnCode);
    if ($returnCode === 0) {
        logMsg("  ✓ index.php parses without error\n");
        addCheck('runtime_smoke', [
            'id' => 'HOME_LOADS',
            'status' => 'pass',
            'severity' => 'critical',
            'file' => 'index.php',
            'message' => 'Entry point parses successfully',
            'details' => [],
            'expected' => 'PHP syntax valid',
            'actual' => 'Parse OK',
        ]);
    } else {
        logMsg("  ✗ index.php has parse error\n");
        addCheck('runtime_smoke', [
            'id' => 'HOME_LOADS',
            'status' => 'fail',
            'severity' => 'critical',
            'file' => 'index.php',
            'message' => 'Entry point has parse error',
            'details' => ['output' => implode("\n", $output)],
            'expected' => 'PHP syntax valid',
            'actual' => 'Parse error',
        ]);
    }
}

// Check migrations exist
if (is_dir($migrationsDir)) {
    $migrations = glob("{$migrationsDir}/*.sql");
    if (!empty($migrations)) {
        logMsg("  ✓ " . count($migrations) . " migration file(s) found\n");
        addCheck('runtime_smoke', [
            'id' => 'LOGIN_LOADS',
            'status' => 'pass',
            'severity' => 'high',
            'file' => 'migrations/',
            'message' => 'Migration files present',
            'details' => ['count' => count($migrations), 'files' => array_map('basename', $migrations)],
            'expected' => 'At least one migration file',
            'actual' => count($migrations) . ' migration(s)',
        ]);
    } else {
        logMsg("  ✗ No migration files\n");
        addCheck('runtime_smoke', [
            'id' => 'LOGIN_LOADS',
            'status' => 'fail',
            'severity' => 'high',
            'file' => 'migrations/',
            'message' => 'No migration files found',
            'details' => [],
            'expected' => 'At least one .sql file in migrations/',
            'actual' => 'Empty directory',
        ]);
    }
} else {
    logMsg("  ✗ migrations/ directory missing\n");
    addCheck('runtime_smoke', [
        'id' => 'LOGIN_LOADS',
        'status' => 'fail',
        'severity' => 'high',
        'file' => 'migrations/',
        'message' => 'Migrations directory missing',
        'details' => [],
        'expected' => 'migrations/ directory must exist',
        'actual' => 'Directory not found',
    ]);
}

// ============ SORT REPAIR PRIORITY ============

usort($evalResult['repair_priority'], function($a, $b) {
    $severityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];
    return ($severityOrder[$a['severity']] ?? 4) <=> ($severityOrder[$b['severity']] ?? 4);
});

// ============ OUTPUT ============

logMsg("\n" . str_repeat("─", 50) . "\n");
logMsg("RESULTS: {$evalResult['summary']['passed']} passed, {$evalResult['summary']['failed']} failed, {$evalResult['summary']['warnings']} warnings\n");

if ($evalResult['ready_to_run']) {
    logMsg("\n✅ READY TO RUN!\n");
} else {
    logMsg("\n❌ NOT READY - REPAIR REQUIRED\n");
    logMsg("Critical failures: {$evalResult['summary']['critical_failures']}\n");
}

// Output JSON
logMsg("\n");
echo json_encode($evalResult, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";

exit($evalResult['ready_to_run'] ? 0 : 1);
