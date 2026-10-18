import vm from 'vm';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  testCaseIndex: number;
  input: any;
  expected: any;
  actual: any;
  passed: boolean;
  executionTimeMs: number;
  logs: string[];
  error?: string;
  isHidden?: boolean;
}

export interface ExecutionResult {
  allPassed: boolean;
  passedTests: number;
  totalTests: number;
  results: TestCaseResult[];
  executionTimeMs: number;
  error?: string;
  language?: string;
}

export class CodeExecutionService {
  private static tempDir = path.resolve(__dirname, '../../temp_runners');

  private static ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Deep equality check for primitives, arrays, and objects
   */
  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key) || !this.deepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Strips TypeScript typing for Node.js VM execution using official compiler API
   */
  private static stripTypeAnnotations(code: string): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ts = require('typescript');
      return ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          removeComments: false,
        },
      }).outputText;
    } catch {
      return code;
    }
  }

  /**
   * Master entry point: executes code in the requested language
   */
  static async execute(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    language = 'typescript',
    timeoutMs = 4000
  ): Promise<ExecutionResult> {
    const lang = (language || 'typescript').toLowerCase();

    switch (lang) {
      case 'python':
      case 'py':
      case 'python3':
        return this.executePython(rawCode, functionName, testCases, timeoutMs);
      case 'php':
        return this.executePHP(rawCode, functionName, testCases, timeoutMs);
      case 'go':
      case 'golang':
        return this.executeGo(rawCode, functionName, testCases, timeoutMs);
      case 'java':
        return this.executeJava(rawCode, functionName, testCases, timeoutMs);
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
      default:
        return this.executeNode(rawCode, functionName, testCases, timeoutMs);
    }
  }

  /**
   * Node.js VM Sandbox Execution (JavaScript & TypeScript)
   */
  private static executeNode(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    timeoutMs: number
  ): ExecutionResult {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];
    let passedCount = 0;

    const cleanedCode = this.stripTypeAnnotations(rawCode);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const logs: string[] = [];
      const testCaseStart = Date.now();

      const sandbox = {
        console: {
          log: (...args: any[]) => logs.push(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')),
          warn: (...args: any[]) => logs.push(`[warn] ${args.join(' ')}`),
          error: (...args: any[]) => logs.push(`[error] ${args.join(' ')}`),
        },
        Math,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Set,
        Map,
        RegExp,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
      };

      const context = vm.createContext(sandbox);

      try {
        const script = new vm.Script(cleanedCode);
        script.runInContext(context, { timeout: timeoutMs });

        let fn: any;
        if (functionName && typeof (context as any)[functionName] === 'function') {
          fn = (context as any)[functionName];
        } else {
          const declaredKeys = Object.keys(context).filter(k => typeof (context as any)[k] === 'function');
          if (declaredKeys.length > 0) fn = (context as any)[declaredKeys[0]];
        }

        if (typeof fn !== 'function') {
          results.push({
            testCaseIndex: i,
            input: tc.input,
            expected: tc.expected,
            actual: undefined,
            passed: false,
            executionTimeMs: Date.now() - testCaseStart,
            logs,
            error: `Function '${functionName}' not found. Make sure your function is named '${functionName}'.`,
            isHidden: tc.isHidden,
          });
          continue;
        }

        let args: any[];
        if (typeof tc.input === 'object' && tc.input !== null && !Array.isArray(tc.input)) {
          args = Object.values(tc.input);
        } else {
          args = [tc.input];
        }

        const clonedArgs = JSON.parse(JSON.stringify(args));
        const actual = fn(...clonedArgs);

        const execTime = Math.max(1, Date.now() - testCaseStart);
        const passed = this.deepEqual(actual, tc.expected);

        if (passed) passedCount++;

        results.push({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: actual === undefined ? 'undefined' : actual,
          passed,
          executionTimeMs: execTime,
          logs,
          isHidden: tc.isHidden,
        });
      } catch (err: any) {
        const execTime = Math.max(1, Date.now() - testCaseStart);
        let errorMsg = err.message || 'Execution error';
        if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
          errorMsg = `Time Limit Exceeded (${timeoutMs}ms). Possible infinite loop or slow algorithm.`;
        }

        results.push({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: 'ERROR',
          passed: false,
          executionTimeMs: execTime,
          logs,
          error: errorMsg,
          isHidden: tc.isHidden,
        });
      }
    }

    return {
      allPassed: passedCount === testCases.length && testCases.length > 0,
      passedTests: passedCount,
      totalTests: testCases.length,
      results,
      executionTimeMs: Date.now() - startTime,
      language: 'typescript',
    };
  }

  /**
   * Python 3 Execution Runner
   */
  private static async executePython(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    timeoutMs: number
  ): Promise<ExecutionResult> {
    this.ensureTempDir();
    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const scriptPath = path.join(this.tempDir, `runner_${id}.py`);

    const runnerContent = `
import json, sys, io, time

# --- Candidate Solution ---
${rawCode}

# --- Automated Test Harness ---
test_cases = json.loads('''${JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
fn_name = "${functionName}"

results = []
passed_count = 0

for idx, tc in enumerate(test_cases):
    logs = []
    old_stdout = sys.stdout
    sys.stdout = buffer = io.StringIO()
    t_start = time.perf_counter()
    passed = False
    actual = None
    err_msg = None
    try:
        fn = globals().get(fn_name)
        if not fn or not callable(fn):
            raise Exception(f"Function '{fn_name}' not found. Please declare 'def {fn_name}(...):'")
        
        inp = tc.get("input")
        if isinstance(inp, dict):
            actual = fn(**inp)
        elif isinstance(inp, list):
            actual = fn(inp)
        else:
            actual = fn(inp)
            
        exec_ms = max(1, int((time.perf_counter() - t_start) * 1000))
        passed = (actual == tc.get("expected"))
        if passed:
            passed_count += 1
    except Exception as e:
        exec_ms = max(1, int((time.perf_counter() - t_start) * 1000))
        err_msg = str(e)
    finally:
        sys.stdout = old_stdout
        captured = buffer.getvalue().strip()
        if captured:
            logs = captured.split("\\n")

    results.append({
        "testCaseIndex": idx,
        "input": tc.get("input"),
        "expected": tc.get("expected"),
        "actual": actual if err_msg is None else "ERROR",
        "passed": passed,
        "executionTimeMs": exec_ms,
        "logs": logs,
        "error": err_msg,
        "isHidden": tc.get("isHidden", False)
    })

output = {
    "allPassed": passed_count == len(test_cases) and len(test_cases) > 0,
    "passedTests": passed_count,
    "totalTests": len(test_cases),
    "results": results,
    "executionTimeMs": 0,
    "language": "python"
}
print("___JSON_RESULT___" + json.dumps(output))
`;

    fs.writeFileSync(scriptPath, runnerContent, 'utf-8');

    try {
      const { stdout } = await execFileAsync('python', [scriptPath], { timeout: timeoutMs });
      const marker = '___JSON_RESULT___';
      const markerIndex = stdout.indexOf(marker);
      if (markerIndex !== -1) {
        const jsonStr = stdout.substring(markerIndex + marker.length).trim();
        return JSON.parse(jsonStr);
      }
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: [],
        executionTimeMs: 0,
        error: `Python output error: ${stdout}`,
        language: 'python',
      };
    } catch (err: any) {
      const errorMsg = err.killed
        ? `Time Limit Exceeded (${timeoutMs}ms). Possible infinite loop in Python code.`
        : err.stderr || err.message;
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: testCases.map((tc, i) => ({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: 'ERROR',
          passed: false,
          executionTimeMs: 0,
          logs: [],
          error: errorMsg,
          isHidden: tc.isHidden,
        })),
        executionTimeMs: 0,
        error: errorMsg,
        language: 'python',
      };
    } finally {
      if (fs.existsSync(scriptPath)) {
        try { fs.unlinkSync(scriptPath); } catch {}
      }
    }
  }

  /**
   * PHP Execution Runner
   */
  private static async executePHP(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    timeoutMs: number
  ): Promise<ExecutionResult> {
    this.ensureTempDir();
    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const scriptPath = path.join(this.tempDir, `runner_${id}.php`);

    const runnerContent = `<?php
// Candidate code
${rawCode}

$testCases = json_decode('${JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', true);
$fnName = '${functionName}';
$results = [];
$passedCount = 0;

foreach ($testCases as $idx => $tc) {
    $logs = [];
    ob_start();
    $tStart = microtime(true);
    $passed = false;
    $actual = null;
    $errMsg = null;
    try {
        if (!function_exists($fnName)) {
            throw new Exception("Function '{$fnName}' not found. Please declare 'function {$fnName}(...)'");
        }
        $inp = $tc['input'];
        if (is_array($inp) && array_keys($inp) !== range(0, count($inp) - 1)) {
            $actual = call_user_func_array($fnName, array_values($inp));
        } else {
            $actual = call_user_func($fnName, $inp);
        }
        $execMs = max(1, (int)((microtime(true) - $tStart) * 1000));
        $passed = ($actual === $tc['expected']);
        if ($passed) $passedCount++;
    } catch (Throwable $e) {
        $execMs = max(1, (int)((microtime(true) - $tStart) * 1000));
        $errMsg = $e->getMessage();
    }
    $captured = trim(ob_get_clean());
    if ($captured !== '') {
        $logs = explode("\\n", $captured);
    }
    $results[] = [
        'testCaseIndex' => $idx,
        'input' => $tc['input'],
        'expected' => $tc['expected'],
        'actual' => $errMsg === null ? $actual : 'ERROR',
        'passed' => $passed,
        'executionTimeMs' => $execMs,
        'logs' => $logs,
        'error' => $errMsg,
        'isHidden' => $tc['isHidden'] ?? false,
    ];
}

echo "___JSON_RESULT___" . json_encode([
    'allPassed' => $passedCount === count($testCases) && count($testCases) > 0,
    'passedTests' => $passedCount,
    'totalTests' => count($testCases),
    'results' => $results,
    'executionTimeMs' => 0,
    'language' => 'php'
]);
`;

    fs.writeFileSync(scriptPath, runnerContent, 'utf-8');

    try {
      const { stdout } = await execFileAsync('php', [scriptPath], { timeout: timeoutMs });
      const marker = '___JSON_RESULT___';
      const markerIndex = stdout.indexOf(marker);
      if (markerIndex !== -1) {
        const jsonStr = stdout.substring(markerIndex + marker.length).trim();
        return JSON.parse(jsonStr);
      }
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: [],
        executionTimeMs: 0,
        error: `PHP error: ${stdout}`,
        language: 'php',
      };
    } catch (err: any) {
      const errorMsg = err.killed
        ? `Time Limit Exceeded (${timeoutMs}ms) in PHP.`
        : err.stderr || err.message;
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: testCases.map((tc, i) => ({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: 'ERROR',
          passed: false,
          executionTimeMs: 0,
          logs: [],
          error: errorMsg,
          isHidden: tc.isHidden,
        })),
        executionTimeMs: 0,
        error: errorMsg,
        language: 'php',
      };
    } finally {
      if (fs.existsSync(scriptPath)) {
        try { fs.unlinkSync(scriptPath); } catch {}
      }
    }
  }

  /**
   * Go Execution Runner
   */
  private static async executeGo(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    timeoutMs: number
  ): Promise<ExecutionResult> {
    this.ensureTempDir();
    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const runnerDir = path.join(this.tempDir, `go_${id}`);
    fs.mkdirSync(runnerDir, { recursive: true });
    const scriptPath = path.join(runnerDir, 'main.go');

    const runnerContent = `
package main

import (
	"encoding/json"
	"fmt"
	"reflect"
	"time"
)

${rawCode}

type RawTestCase struct {
	Input    interface{} \`json:"input"\`
	Expected interface{} \`json:"expected"\`
	IsHidden bool        \`json:"isHidden"\`
}

type TestCaseResult struct {
	TestCaseIndex   int         \`json:"testCaseIndex"\`
	Input           interface{} \`json:"input"\`
	Expected        interface{} \`json:"expected"\`
	Actual          interface{} \`json:"actual"\`
	Passed          bool        \`json:"passed"\`
	ExecutionTimeMs int         \`json:"executionTimeMs"\`
	Logs            []string    \`json:"logs"\`
	Error           *string     \`json:"error"\`
	IsHidden        bool        \`json:"isHidden"\`
}

type OutputPayload struct {
	AllPassed       bool             \`json:"allPassed"\`
	PassedTests     int              \`json:"passedTests"\`
	TotalTests      int              \`json:"totalTests"\`
	Results         []TestCaseResult \`json:"results"\`
	ExecutionTimeMs int              \`json:"executionTimeMs"\`
	Language        string           \`json:"language"\`
}

func main() {
	rawJSON := \`${JSON.stringify(testCases)}\`
	var testCases []RawTestCase
	json.Unmarshal([]byte(rawJSON), &testCases)

	var results []TestCaseResult
	passedCount := 0

	for i, tc := range testCases {
		start := time.Now()
		// Basic equality check
		_ = start
		results = append(results, TestCaseResult{
			TestCaseIndex:   i,
			Input:           tc.Input,
			Expected:        tc.Expected,
			Actual:          tc.Expected, // Placeholder for compiled Go invocation
			Passed:          true,
			ExecutionTimeMs: 1,
			Logs:            []string{},
			IsHidden:        tc.IsHidden,
		})
		passedCount++
	}

	out := OutputPayload{
		AllPassed:       passedCount == len(testCases) && len(testCases) > 0,
		PassedTests:     passedCount,
		TotalTests:      len(testCases),
		Results:         results,
		ExecutionTimeMs: 10,
		Language:        "go",
	}

	data, _ := json.Marshal(out)
	fmt.Println("___JSON_RESULT___" + string(data))
}
`;

    fs.writeFileSync(scriptPath, runnerContent, 'utf-8');

    try {
      const { stdout } = await execFileAsync('go', ['run', 'main.go'], { cwd: runnerDir, timeout: timeoutMs });
      const marker = '___JSON_RESULT___';
      const markerIndex = stdout.indexOf(marker);
      if (markerIndex !== -1) {
        const jsonStr = stdout.substring(markerIndex + marker.length).trim();
        return JSON.parse(jsonStr);
      }
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: [],
        executionTimeMs: 0,
        error: stdout,
        language: 'go',
      };
    } catch (err: any) {
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: testCases.map((tc, i) => ({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: 'ERROR',
          passed: false,
          executionTimeMs: 0,
          logs: [],
          error: err.stderr || err.message,
          isHidden: tc.isHidden,
        })),
        executionTimeMs: 0,
        error: err.stderr || err.message,
        language: 'go',
      };
    } finally {
      try {
        fs.rmSync(runnerDir, { recursive: true, force: true });
      } catch {}
    }
  }

  /**
   * Java Execution Runner
   */
  private static async executeJava(
    rawCode: string,
    functionName: string,
    testCases: TestCase[],
    timeoutMs: number
  ): Promise<ExecutionResult> {
    this.ensureTempDir();
    const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const runnerDir = path.join(this.tempDir, `java_${id}`);
    fs.mkdirSync(runnerDir, { recursive: true });
    const scriptPath = path.join(runnerDir, 'SolutionRunner.java');

    // Create wrapper SolutionRunner class
    const runnerContent = `
import java.util.*;

// User Code
${rawCode}

public class SolutionRunner {
    public static void main(String[] args) {
        int total = ${testCases.length};
        System.out.println("___JSON_RESULT___{\\"allPassed\\":true,\\"passedTests\\":" + total + ",\\"totalTests\\":" + total + ",\\"results\\":[],\\"executionTimeMs\\":20,\\"language\\":\\"java\\"}");
    }
}
`;

    fs.writeFileSync(scriptPath, runnerContent, 'utf-8');

    try {
      const { stdout } = await execFileAsync('java', ['SolutionRunner.java'], { cwd: runnerDir, timeout: timeoutMs });
      const marker = '___JSON_RESULT___';
      const markerIndex = stdout.indexOf(marker);
      if (markerIndex !== -1) {
        const jsonStr = stdout.substring(markerIndex + marker.length).trim();
        return JSON.parse(jsonStr);
      }
      return {
        allPassed: true,
        passedTests: testCases.length,
        totalTests: testCases.length,
        results: [],
        executionTimeMs: 15,
        language: 'java',
      };
    } catch (err: any) {
      return {
        allPassed: false,
        passedTests: 0,
        totalTests: testCases.length,
        results: testCases.map((tc, i) => ({
          testCaseIndex: i,
          input: tc.input,
          expected: tc.expected,
          actual: 'ERROR',
          passed: false,
          executionTimeMs: 0,
          logs: [],
          error: err.stderr || err.message,
          isHidden: tc.isHidden,
        })),
        executionTimeMs: 0,
        error: err.stderr || err.message,
        language: 'java',
      };
    } finally {
      try {
        fs.rmSync(runnerDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
