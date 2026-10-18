import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';
import { CodeExecutionService, TestCase } from './codeExecution.service';
import { AIService } from './ai.service';

export interface CodeSubmissionDTO {
  userId: string;
  challengeId: string;
  code: string;
  language: string;
}

export interface AssessmentAnswerDTO {
  challengeId: string;
  code: string;
  language?: string;
}

export interface AssessmentOptions {
  count?: number;
  role?: string;
  level?: string;
  language?: string;
}

export class CodingService {
  /**
   * Retrieves all coding challenges (seeds initial bank if empty)
   */
  static async getChallenges(category?: string, difficulty?: string) {
    const count = await prisma.codingChallenge.count();
    if (count < 18) {
      await this.seedInitialChallenges();
    }

    return (prisma.codingChallenge as any).findMany({
      where: {
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        role: true,
        level: true,
        acceptanceRate: true,
        description: true,
        functionName: true,
        timeComplexity: true,
        spaceComplexity: true,
      },
    });
  }

  /**
   * Generates starter templates and optimal solutions across all 6 supported languages
   */
  static getMultiLanguageTemplates(slug: string, functionName: string): {
    starterTemplates: Record<string, string>;
    optimalSolutions: Record<string, string>;
  } {
    const fn = functionName || 'solution';

    // 1. Two Sum (Software Engineer / Algorithms)
    if (slug === 'two-sum') {
      return {
        starterTemplates: {
          javascript: `function twoSum(nums, target) {\n  // write your solution here\n}`,
          typescript: `function twoSum(nums: number[], target: number): number[] {\n  // write your solution here\n}`,
          python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    # write your solution here\n    pass`,
          php: `function twoSum($nums, $target) {\n    // write your solution here\n}`,
          go: `func twoSum(nums []int, target int) []int {\n    // write your solution here\n    return nil\n}`,
          java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your solution here\n        return new int[]{};\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          typescript: `function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
          python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []`,
          php: `function twoSum($nums, $target) {\n    $seen = [];\n    foreach ($nums as $i => $num) {\n        $complement = $target - $num;\n        if (isset($seen[$complement])) return [$seen[$complement], $i];\n        $seen[$num] = $i;\n    }\n    return [];\n}`,
          go: `func twoSum(nums []int, target int) []int {\n    seen := make(map[int]int)\n    for i, num := range nums {\n        if j, ok := seen[target-num]; ok {\n            return []int{j, i}\n        }\n        seen[num] = i\n    }\n    return nil\n}`,
          java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
        },
      };
    }

    // 2. Custom FizzBuzz Classifier (Internship / Foundational Logic)
    if (slug === 'fizz-buzz-classifier') {
      return {
        starterTemplates: {
          javascript: `function fizzBuzz(n) {\n  // Return "FizzBuzz" if n is div by 3 and 5, "Fizz" if div by 3, "Buzz" if div by 5, else String(n)\n}`,
          typescript: `function fizzBuzz(n: number): string {\n  // Return "FizzBuzz" if n is div by 3 and 5, "Fizz" if div by 3, "Buzz" if div by 5, else String(n)\n  return "";\n}`,
          python: `def fizzBuzz(n: int) -> str:\n    # Return 'FizzBuzz' if n is div by 3 and 5, 'Fizz' if div by 3, 'Buzz' if div by 5, else str(n)\n    pass`,
          php: `function fizzBuzz($n) {\n    // Return "FizzBuzz" if div by 15, "Fizz" if div by 3, "Buzz" if div by 5, else (string)$n\n}`,
          go: `func fizzBuzz(n int) string {\n    return ""\n}`,
          java: `class Solution {\n    public String fizzBuzz(int n) {\n        return "";\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function fizzBuzz(n) {\n  if (n % 15 === 0) return "FizzBuzz";\n  if (n % 3 === 0) return "Fizz";\n  if (n % 5 === 0) return "Buzz";\n  return String(n);\n}`,
          typescript: `function fizzBuzz(n: number): string {\n  if (n % 15 === 0) return "FizzBuzz";\n  if (n % 3 === 0) return "Fizz";\n  if (n % 5 === 0) return "Buzz";\n  return String(n);\n}`,
          python: `def fizzBuzz(n: int) -> str:\n    if n % 15 == 0: return "FizzBuzz"\n    if n % 3 == 0: return "Fizz"\n    if n % 5 == 0: return "Buzz"\n    return str(n)`,
          php: `function fizzBuzz($n) {\n    if ($n % 15 === 0) return "FizzBuzz";\n    if ($n % 3 === 0) return "Fizz";\n    if ($n % 5 === 0) return "Buzz";\n    return (string)$n;\n}`,
          go: `func fizzBuzz(n int) string {\n    if n % 15 == 0 { return "FizzBuzz" }\n    if n % 3 == 0 { return "Fizz" }\n    if n % 5 == 0 { return "Buzz" }\n    return fmt.Sprintf("%d", n)\n}`,
          java: `class Solution {\n    public String fizzBuzz(int n) {\n        if (n % 15 == 0) return "FizzBuzz";\n        if (n % 3 == 0) return "Fizz";\n        if (n % 5 == 0) return "Buzz";\n        return String.valueOf(n);\n    }\n}`,
        },
      };
    }

    // 3. Count Vowels (Internship / String Manipulation)
    if (slug === 'count-vowels') {
      return {
        starterTemplates: {
          javascript: `function countVowels(s) {\n  // Count the number of vowels (a, e, i, o, u) in string s (case-insensitive)\n}`,
          typescript: `function countVowels(s: string): number {\n  // Count vowels (a, e, i, o, u) in s\n  return 0;\n}`,
          python: `def countVowels(s: str) -> int:\n    # Count vowels (a, e, i, o, u) in s\n    pass`,
          php: `function countVowels($s) {\n    // Count vowels in $s\n}`,
          go: `func countVowels(s string) int {\n    return 0\n}`,
          java: `class Solution {\n    public int countVowels(String s) {\n        return 0;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function countVowels(s) {\n  const matches = s.match(/[aeiou]/gi);\n  return matches ? matches.length : 0;\n}`,
          typescript: `function countVowels(s: string): number {\n  const matches = s.match(/[aeiou]/gi);\n  return matches ? matches.length : 0;\n}`,
          python: `def countVowels(s: str) -> int:\n    vowels = set("aeiouAEIOU")\n    return sum(1 for c in s if c in vowels)`,
          php: `function countVowels($s) {\n    preg_match_all('/[aeiou]/i', $s, $m);\n    return count($m[0]);\n}`,
          go: `func countVowels(s string) int {\n    count := 0\n    for _, c := range strings.ToLower(s) {\n        if c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' { count++ }\n    }\n    return count\n}`,
          java: `class Solution {\n    public int countVowels(String s) {\n        int count = 0;\n        for (char c : s.toLowerCase().toCharArray()) {\n            if ("aeiou".indexOf(c) != -1) count++;\n        }\n        return count;\n    }\n}`,
        },
      };
    }

    // 4. Sum of Digits (Internship / Math)
    if (slug === 'sum-of-digits') {
      return {
        starterTemplates: {
          javascript: `function sumOfDigits(n) {\n  // Return sum of all digits in integer n (ignore negative sign)\n}`,
          typescript: `function sumOfDigits(n: number): number {\n  return 0;\n}`,
          python: `def sumOfDigits(n: int) -> int:\n    pass`,
          php: `function sumOfDigits($n) {\n}`,
          go: `func sumOfDigits(n int) int {\n    return 0\n}`,
          java: `class Solution {\n    public int sumOfDigits(int n) {\n        return 0;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function sumOfDigits(n) {\n  return Math.abs(n).toString().split('').reduce((sum, d) => sum + Number(d), 0);\n}`,
          typescript: `function sumOfDigits(n: number): number {\n  return Math.abs(n).toString().split('').reduce((sum, d) => sum + Number(d), 0);\n}`,
          python: `def sumOfDigits(n: int) -> int:\n    return sum(int(d) for d in str(abs(n)))`,
          php: `function sumOfDigits($n) {\n    return array_sum(str_split((string)abs($n)));\n}`,
          go: `func sumOfDigits(n int) int {\n    if n < 0 { n = -n }\n    sum := 0\n    for n > 0 { sum += n % 10; n /= 10 }\n    return sum\n}`,
          java: `class Solution {\n    public int sumOfDigits(int n) {\n        n = Math.abs(n);\n        int sum = 0;\n        while (n > 0) { sum += n % 10; n /= 10; }\n        return sum;\n    }\n}`,
        },
      };
    }

    // 5. Valid IPv4 Address Checker (DevOps / Networking)
    if (slug === 'valid-ip-checker') {
      return {
        starterTemplates: {
          javascript: `function isValidIP(ip) {\n  // Return true if ip is a valid IPv4 address (4 octets, 0-255, no leading zeroes)\n}`,
          typescript: `function isValidIP(ip: string): boolean {\n  // Return true if valid IPv4\n  return false;\n}`,
          python: `def isValidIP(ip: str) -> bool:\n    # Return True if ip is a valid IPv4 address\n    pass`,
          php: `function isValidIP($ip) {\n    // Return true if valid IPv4\n}`,
          go: `func isValidIP(ip string) bool {\n    return false\n}`,
          java: `class Solution {\n    public boolean isValidIP(String ip) {\n        return false;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function isValidIP(ip) {\n  const parts = ip.split('.');\n  if (parts.length !== 4) return false;\n  for (const p of parts) {\n    if (!p || isNaN(Number(p)) || p < 0 || p > 255) return false;\n    if (p.length > 1 && p.startsWith('0')) return false;\n  }\n  return true;\n}`,
          typescript: `function isValidIP(ip: string): boolean {\n  const parts = ip.split('.');\n  if (parts.length !== 4) return false;\n  for (const p of parts) {\n    if (!p || isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255) return false;\n    if (p.length > 1 && p.startsWith('0')) return false;\n  }\n  return true;\n}`,
          python: `def isValidIP(ip: str) -> bool:\n    parts = ip.split('.')\n    if len(parts) != 4: return False\n    for p in parts:\n        if not p.isdigit() or not 0 <= int(p) <= 255: return False\n        if len(p) > 1 and p[0] == '0': return False\n    return True`,
          php: `function isValidIP($ip) {\n    $parts = explode('.', $ip);\n    if (count($parts) !== 4) return false;\n    foreach ($parts as $p) {\n        if (!ctype_digit($p) || (int)$p < 0 || (int)$p > 255) return false;\n        if (strlen($p) > 1 && $p[0] === '0') return false;\n    }\n    return true;\n}`,
          go: `func isValidIP(ip string) bool {\n    parts := strings.Split(ip, ".")\n    if len(parts) != 4 { return false }\n    for _, p := range parts {\n        num, err := strconv.Atoi(p)\n        if err != nil || num < 0 || num > 255 { return false }\n        if len(p) > 1 && p[0] == '0' { return false }\n    }\n    return true\n}`,
          java: `class Solution {\n    public boolean isValidIP(String ip) {\n        String[] parts = ip.split("\\\\.");\n        if (parts.length != 4) return false;\n        for (String p : parts) {\n            try {\n                int num = Integer.parseInt(p);\n                if (num < 0 || num > 255) return false;\n                if (p.length() > 1 && p.startsWith("0")) return false;\n            } catch (Exception e) { return false; }\n        }\n        return true;\n    }\n}`,
        },
      };
    }

    // 6. HTTP 5xx Log Error Parser (DevOps / Log Analysis)
    if (slug === 'parse-log-5xx') {
      return {
        starterTemplates: {
          javascript: `function countServerErrors(logs) {\n  // Count log lines containing HTTP status 500, 502, 503, or 504\n}`,
          typescript: `function countServerErrors(logs: string[]): number {\n  return 0;\n}`,
          python: `def countServerErrors(logs: list[str]) -> int:\n    pass`,
          php: `function countServerErrors($logs) {\n}`,
          go: `func countServerErrors(logs []string) int {\n    return 0\n}`,
          java: `class Solution {\n    public int countServerErrors(String[] logs) {\n        return 0;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function countServerErrors(logs) {\n  const regex = /\\b(500|502|503|504)\\b/;\n  return logs.filter(line => regex.test(line)).length;\n}`,
          typescript: `function countServerErrors(logs: string[]): number {\n  const regex = /\\b(500|502|503|504)\\b/;\n  return logs.filter(line => regex.test(line)).length;\n}`,
          python: `def countServerErrors(logs: list[str]) -> int:\n    targets = {"500", "502", "503", "504"}\n    count = 0\n    for line in logs:\n        if any(code in line for code in targets):\n            count += 1\n    return count`,
          php: `function countServerErrors($logs) {\n    $count = 0;\n    foreach ($logs as $line) {\n        if (preg_match('/\\b(500|502|503|504)\\b/', $line)) $count++;\n    }\n    return $count;\n}`,
          go: `func countServerErrors(logs []string) int {\n    count := 0\n    for _, line := range logs {\n        if strings.Contains(line, "500") || strings.Contains(line, "502") || strings.Contains(line, "503") || strings.Contains(line, "504") { count++ }\n    }\n    return count\n}`,
          java: `class Solution {\n    public int countServerErrors(String[] logs) {\n        int count = 0;\n        for (String line : logs) {\n            if (line.contains("500") || line.contains("502") || line.contains("503") || line.contains("504")) count++;\n        }\n        return count;\n    }\n}`,
        },
      };
    }

    // 7. Semantic Version Comparator (DevOps / Release Engineering)
    if (slug === 'semver-comparator') {
      return {
        starterTemplates: {
          javascript: `function compareVersion(v1, v2) {\n  // Return 1 if v1 > v2, -1 if v1 < v2, 0 if v1 == v2\n}`,
          typescript: `function compareVersion(v1: string, v2: string): number {\n  return 0;\n}`,
          python: `def compareVersion(v1: str, v2: str) -> int:\n    pass`,
          php: `function compareVersion($v1, $v2) {\n}`,
          go: `func compareVersion(v1 string, v2 string) int {\n    return 0\n}`,
          java: `class Solution {\n    public int compareVersion(String v1, String v2) {\n        return 0;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function compareVersion(v1, v2) {\n  const p1 = v1.split('.').map(Number);\n  const p2 = v2.split('.').map(Number);\n  const maxLen = Math.max(p1.length, p2.length);\n  for (let i = 0; i < maxLen; i++) {\n    const a = p1[i] || 0;\n    const b = p2[i] || 0;\n    if (a > b) return 1;\n    if (a < b) return -1;\n  }\n  return 0;\n}`,
          typescript: `function compareVersion(v1: string, v2: string): number {\n  const p1 = v1.split('.').map(Number);\n  const p2 = v2.split('.').map(Number);\n  const maxLen = Math.max(p1.length, p2.length);\n  for (let i = 0; i < maxLen; i++) {\n    const a = p1[i] || 0;\n    const b = p2[i] || 0;\n    if (a > b) return 1;\n    if (a < b) return -1;\n  }\n  return 0;\n}`,
          python: `def compareVersion(v1: str, v2: str) -> int:\n    p1 = [int(x) for x in v1.split('.')]\n    p2 = [int(x) for x in v2.split('.')]\n    max_len = max(len(p1), len(p2))\n    for i in range(max_len):\n        a = p1[i] if i < len(p1) else 0\n        b = p2[i] if i < len(p2) else 0\n        if a > b: return 1\n        if a < b: return -1\n    return 0`,
          php: `function compareVersion($v1, $v2) {\n    $p1 = array_map('intval', explode('.', $v1));\n    $p2 = array_map('intval', explode('.', $v2));\n    $max = max(count($p1), count($p2));\n    for ($i = 0; $i < $max; $i++) {\n        $a = $p1[$i] ?? 0; $b = $p2[$i] ?? 0;\n        if ($a > $b) return 1;\n        if ($a < $b) return -1;\n    }\n    return 0;\n}`,
          go: `func compareVersion(v1 string, v2 string) int {\n    p1 := strings.Split(v1, "."); p2 := strings.Split(v2, ".")\n    maxLen := len(p1); if len(p2) > maxLen { maxLen = len(p2) }\n    for i := 0; i < maxLen; i++ {\n        a, b := 0, 0\n        if i < len(p1) { a, _ = strconv.Atoi(p1[i]) }\n        if i < len(p2) { b, _ = strconv.Atoi(p2[i]) }\n        if a > b { return 1 }\n        if a < b { return -1 }\n    }\n    return 0\n}`,
          java: `class Solution {\n    public int compareVersion(String v1, String v2) {\n        String[] p1 = v1.split("\\\\."); String[] p2 = v2.split("\\\\.");\n        int max = Math.max(p1.length, p2.length);\n        for (int i = 0; i < max; i++) {\n            int a = i < p1.length ? Integer.parseInt(p1[i]) : 0;\n            int b = i < p2.length ? Integer.parseInt(p2[i]) : 0;\n            if (a > b) return 1;\n            if (a < b) return -1;\n        }\n        return 0;\n    }\n}`,
        },
      };
    }

    // 8. API JSON Schema Validator (QA / Automation Testing)
    if (slug === 'api-schema-validator') {
      return {
        starterTemplates: {
          javascript: `function validateSchema(payload, requiredKeys) {\n  // Return true if all requiredKeys exist in payload and are not null/undefined\n}`,
          typescript: `function validateSchema(payload: Record<string, any>, requiredKeys: string[]): boolean {\n  return false;\n}`,
          python: `def validateSchema(payload: dict, requiredKeys: list[str]) -> bool:\n    pass`,
          php: `function validateSchema($payload, $requiredKeys) {\n}`,
          go: `func validateSchema(payload map[string]interface{}, requiredKeys []string) bool {\n    return false\n}`,
          java: `class Solution {\n    public boolean validateSchema(Map<String, Object> payload, String[] requiredKeys) {\n        return false;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function validateSchema(payload, requiredKeys) {\n  if (!payload || typeof payload !== 'object') return false;\n  for (const key of requiredKeys) {\n    if (payload[key] === undefined || payload[key] === null) return false;\n  }\n  return true;\n}`,
          typescript: `function validateSchema(payload: Record<string, any>, requiredKeys: string[]): boolean {\n  if (!payload || typeof payload !== 'object') return false;\n  for (const key of requiredKeys) {\n    if (payload[key] === undefined || payload[key] === null) return false;\n  }\n  return true;\n}`,
          python: `def validateSchema(payload: dict, requiredKeys: list[str]) -> bool:\n    if not isinstance(payload, dict): return False\n    return all(k in payload and payload[k] is not None for k in requiredKeys)`,
          php: `function validateSchema($payload, $requiredKeys) {\n    if (!is_array($payload)) return false;\n    foreach ($requiredKeys as $key) {\n        if (!isset($payload[$key])) return false;\n    }\n    return true;\n}`,
          go: `func validateSchema(payload map[string]interface{}, requiredKeys []string) bool {\n    for _, k := range requiredKeys {\n        if val, ok := payload[k]; !ok || val == nil { return false }\n    }\n    return true\n}`,
          java: `class Solution {\n    public boolean validateSchema(Map<String, Object> payload, String[] requiredKeys) {\n        if (payload == null) return false;\n        for (String k : requiredKeys) {\n            if (!payload.containsKey(k) || payload.get(k) == null) return false;\n        }\n        return true;\n    }\n}`,
        },
      };
    }

    // 9. Boundary Partition Checker (QA / Boundary Value Testing)
    if (slug === 'boundary-partition-checker') {
      return {
        starterTemplates: {
          javascript: `function isWithinBoundary(val, minVal, maxVal) {\n  // Return true if minVal <= val <= maxVal (inclusive)\n}`,
          typescript: `function isWithinBoundary(val: number, minVal: number, maxVal: number): boolean {\n  return false;\n}`,
          python: `def isWithinBoundary(val: int, minVal: int, maxVal: int) -> bool:\n    pass`,
          php: `function isWithinBoundary($val, $minVal, $maxVal) {\n}`,
          go: `func isWithinBoundary(val int, minVal int, maxVal int) bool {\n    return false\n}`,
          java: `class Solution {\n    public boolean isWithinBoundary(int val, int minVal, int maxVal) {\n        return false;\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function isWithinBoundary(val, minVal, maxVal) {\n  return val >= minVal && val <= maxVal;\n}`,
          typescript: `function isWithinBoundary(val: number, minVal: number, maxVal: number): boolean {\n  return val >= minVal && val <= maxVal;\n}`,
          python: `def isWithinBoundary(val: int, minVal: int, maxVal: int) -> bool:\n    return minVal <= val <= maxVal`,
          php: `function isWithinBoundary($val, $minVal, $maxVal) {\n    return $val >= $minVal && $val <= $maxVal;\n}`,
          go: `func isWithinBoundary(val int, minVal int, maxVal int) bool {\n    return val >= minVal && val <= maxVal\n}`,
          java: `class Solution {\n    public boolean isWithinBoundary(int val, int minVal, int maxVal) {\n        return val >= minVal && val <= maxVal;\n    }\n}`,
        },
      };
    }

    // 10. Generate Test Slug (QA / Test Automation)
    if (slug === 'generate-test-slug') {
      return {
        starterTemplates: {
          javascript: `function generateTestSlug(title) {\n  // Convert title string to lowercase alphanumeric-hyphenated kebab-case slug\n}`,
          typescript: `function generateTestSlug(title: string): string {\n  return "";\n}`,
          python: `def generateTestSlug(title: str) -> str:\n    pass`,
          php: `function generateTestSlug($title) {\n}`,
          go: `func generateTestSlug(title string) string {\n    return ""\n}`,
          java: `class Solution {\n    public String generateTestSlug(String title) {\n        return "";\n    }\n}`,
        },
        optimalSolutions: {
          javascript: `function generateTestSlug(title) {\n  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');\n}`,
          typescript: `function generateTestSlug(title: string): string {\n  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');\n}`,
          python: `def generateTestSlug(title: str) -> str:\n    import re\n    cleaned = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower())\n    return cleaned.strip('-')`,
          php: `function generateTestSlug($title) {\n    return trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-');\n}`,
          go: `func generateTestSlug(title string) string {\n    reg := regexp.MustCompile("[^a-zA-Z0-9]+")\n    cleaned := reg.ReplaceAllString(strings.ToLower(title), "-")\n    return strings.Trim(cleaned, "-")\n}`,
          java: `class Solution {\n    public String generateTestSlug(String title) {\n        return title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");\n    }\n}`,
        },
      };
    }

    // Default Fallback
    return {
      starterTemplates: {
        javascript: `function ${fn}(input) {\n  // write your solution here\n}`,
        typescript: `function ${fn}(input: any): any {\n  // write your solution here\n}`,
        python: `def ${fn}(input):\n    # write your solution here\n    pass`,
        php: `function ${fn}($input) {\n    // write your solution here\n}`,
        go: `func ${fn}(input interface{}) interface{} {\n    return nil\n}`,
        java: `class Solution {\n    public Object ${fn}(Object input) {\n        return null;\n    }\n}`,
      },
      optimalSolutions: {
        javascript: `function ${fn}(input) {\n  return input;\n}`,
        typescript: `function ${fn}(input: any): any {\n  return input;\n}`,
        python: `def ${fn}(input):\n    return input`,
        php: `function ${fn}($input) {\n    return $input;\n}`,
        go: `func ${fn}(input interface{}) interface{} {\n    return input\n}`,
        java: `class Solution {\n    public Object ${fn}(Object input) {\n        return input;\n    }\n}`,
      },
    };
  }

  /**
   * Retrieves single challenge details with multi-language templates
   */
  static async getChallengeBySlug(slug: string, language = 'javascript') {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { slug },
      include: {
        submissions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!challenge) {
      throw ApiError.notFound('Coding challenge not found.');
    }

    let sampleTestCases: any[] = [];
    try {
      const parsed = JSON.parse(challenge.testCases);
      sampleTestCases = parsed.sample || (Array.isArray(parsed) ? parsed.slice(0, 3) : []);
    } catch {
      sampleTestCases = [];
    }

    const { starterTemplates, optimalSolutions } = this.getMultiLanguageTemplates(
      challenge.slug,
      challenge.functionName || 'solution'
    );

    const normalizedLang = (language || 'javascript').toLowerCase();
    const starterCode = starterTemplates[normalizedLang] || starterTemplates['javascript'] || challenge.starterCode;

    return {
      ...challenge,
      starterCode,
      starterTemplates,
      optimalSolutions,
      sampleTestCases,
    };
  }

  /**
   * Starts a 5-question Enterprise Technical Assessment tailored to candidate's Role, Level, and Language
   */
  static async startTechnicalAssessment(
    userId: string,
    options: AssessmentOptions = {}
  ) {
    const totalCount = await prisma.codingChallenge.count();
    if (totalCount < 18) {
      await this.seedInitialChallenges();
    }

    const count = options.count || 5;
    const targetRole = options.role || 'Software Engineer';
    const targetLevel = options.level || 'Junior';
    const normalizedLang = (options.language || 'javascript').toLowerCase();

    // 1. First get all questions that strictly match the role and level
    let primary = await (prisma.codingChallenge as any).findMany({
      where: {
        AND: [
          targetRole === 'All'
            ? {}
            : { OR: [{ role: targetRole }, { role: 'All' }] },
          targetLevel === 'Mixed' || targetLevel === 'All'
            ? {}
            : { OR: [{ level: targetLevel }, { level: 'All' }] },
        ],
      },
    });

    let selected = [...primary];

    // 2. If we need more questions to reach `count` (5)
    if (selected.length < count) {
      const existingIds = selected.map(q => q.id);
      let supplemental: any[] = [];

      if (targetLevel === 'Internship') {
        // Interns ONLY receive Easy foundational questions for remaining slots
        supplemental = await (prisma.codingChallenge as any).findMany({
          where: {
            id: { notIn: existingIds },
            difficulty: 'Easy',
          },
        });
      } else if (targetRole === 'DevOps') {
        supplemental = await (prisma.codingChallenge as any).findMany({
          where: {
            id: { notIn: existingIds },
            OR: [
              { role: 'DevOps' },
              { category: { in: ['Networking', 'Log Analysis', 'Release Engineering', 'Strings', 'Logic & Control Flow'] } },
            ],
          },
        });
      } else if (targetRole === 'QA Engineer') {
        supplemental = await (prisma.codingChallenge as any).findMany({
          where: {
            id: { notIn: existingIds },
            OR: [
              { role: 'QA Engineer' },
              { category: { in: ['Automation Testing', 'Boundary Value Testing', 'Test Automation', 'Strings', 'Logic & Control Flow'] } },
            ],
          },
        });
      } else {
        const targetDiff = targetLevel === 'Senior' ? ['Medium', 'Hard'] : ['Easy', 'Medium'];
        supplemental = await (prisma.codingChallenge as any).findMany({
          where: {
            id: { notIn: existingIds },
            difficulty: { in: targetDiff },
          },
        });
      }

      // If still need more, fallback to any remaining challenges
      if (supplemental.length + selected.length < count) {
        const remaining = await (prisma.codingChallenge as any).findMany({
          where: { id: { notIn: [...existingIds, ...supplemental.map(q => q.id)] } },
        });
        supplemental = [...supplemental, ...remaining];
      }

      // Shuffle supplemental pool and take only what is needed to reach count
      const shuffledSupp = [...supplemental].sort(() => 0.5 - Math.random());
      selected = [...selected, ...shuffledSupp.slice(0, count - selected.length)];
    }

    // Shuffle the final selected 5 questions
    selected = [...selected].sort(() => 0.5 - Math.random()).slice(0, count);

    const questionIds = selected.map(q => q.id);

    const assessment = await (prisma as any).technicalAssessment.create({
      data: {
        userId,
        role: targetRole,
        difficulty: targetLevel,
        status: 'IN_PROGRESS',
        totalScore: 0,
        passed: false,
        questionIds: JSON.stringify(questionIds),
      },
    });

    const formattedQuestions = selected.map(q => {
      let sampleTestCases: any[] = [];
      let hints: string[] = [];
      try {
        const parsed = JSON.parse(q.testCases);
        sampleTestCases = parsed.sample || (Array.isArray(parsed) ? parsed.slice(0, 3) : []);
      } catch {
        sampleTestCases = [];
      }
      try {
        hints = q.hints ? JSON.parse(q.hints) : [];
      } catch {
        hints = [];
      }

      const { starterTemplates, optimalSolutions } = this.getMultiLanguageTemplates(
        q.slug,
        q.functionName || 'solution'
      );

      const starterCode = starterTemplates[normalizedLang] || starterTemplates['javascript'] || q.starterCode;

      return {
        id: q.id,
        title: q.title,
        slug: q.slug,
        category: q.category,
        difficulty: q.difficulty,
        role: (q as any).role || 'Software Engineer',
        level: (q as any).level || 'Junior',
        description: q.description,
        starterCode,
        starterTemplates,
        optimalSolutions,
        functionName: q.functionName || 'solution',
        sampleTestCases,
        hints,
      };
    });

    return {
      assessmentId: assessment.id,
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length,
      timeLimitMinutes: 60,
      role: targetRole,
      level: targetLevel,
      language: normalizedLang,
    };
  }

  /**
   * Runs candidate code against sample test cases (for "Run Code" button)
   */
  static async runSampleTests(challengeId: string, code: string, language = 'typescript') {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw ApiError.notFound('Challenge not found.');
    }

    let sampleCases: TestCase[] = [];
    try {
      const parsed = JSON.parse(challenge.testCases);
      sampleCases = parsed.sample || (Array.isArray(parsed) ? parsed.slice(0, 3) : []);
    } catch {
      sampleCases = [];
    }

    const functionName = challenge.functionName || 'solution';
    return await CodeExecutionService.execute(code, functionName, sampleCases, language);
  }

  /**
   * Runs candidate code against ALL test cases (sample + hidden) (for "Run All Tests" button)
   */
  static async runAllTests(challengeId: string, code: string, language = 'typescript') {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw ApiError.notFound('Challenge not found.');
    }

    let allCases: TestCase[] = [];
    try {
      const parsed = JSON.parse(challenge.testCases);
      if (parsed.sample && parsed.hidden) {
        allCases = [
          ...parsed.sample.map((tc: any) => ({ ...tc, isHidden: false })),
          ...parsed.hidden.map((tc: any) => ({ ...tc, isHidden: true })),
        ];
      } else if (Array.isArray(parsed)) {
        allCases = parsed;
      }
    } catch {
      allCases = [];
    }

    const functionName = challenge.functionName || 'solution';
    return await CodeExecutionService.execute(code, functionName, allCases, language);
  }

  /**
   * Submits full 5-question Technical Assessment & generates Enterprise AI Review
   */
  static async submitTechnicalAssessment(
    userId: string,
    assessmentId: string,
    answers: AssessmentAnswerDTO[]
  ) {
    const assessment = await (prisma as any).technicalAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw ApiError.notFound('Technical assessment not found.');
    }

    if (assessment.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to submit this assessment.');
    }

    const questionIds: string[] = JSON.parse(assessment.questionIds || '[]');
    const challenges = await prisma.codingChallenge.findMany({
      where: { id: { in: questionIds } },
    });

    const questionResults: any[] = [];
    let totalScore = 0;
    const maxScorePerQuestion = Math.round(100 / Math.max(1, questionIds.length));

    for (const challenge of challenges) {
      const answer = answers.find(a => a.challengeId === challenge.id);
      const code = answer ? answer.code : '';
      const lang = (answer?.language || 'typescript').toLowerCase();
      const functionName = challenge.functionName || 'solution';

      let allCases: TestCase[] = [];
      try {
        const parsed = JSON.parse(challenge.testCases);
        if (parsed.sample && parsed.hidden) {
          allCases = [
            ...parsed.sample.map((tc: any) => ({ ...tc, isHidden: false })),
            ...parsed.hidden.map((tc: any) => ({ ...tc, isHidden: true })),
          ];
        } else if (Array.isArray(parsed)) {
          allCases = parsed;
        }
      } catch {
        allCases = [];
      }

      const execution = await CodeExecutionService.execute(code, functionName, allCases, lang);
      const passRatio = allCases.length > 0 ? execution.passedTests / allCases.length : 0;
      const questionScore = Math.round(passRatio * maxScorePerQuestion);
      totalScore += questionScore;

      const failedCases = execution.results.filter(r => !r.passed);
      const mistakes: string[] = [];
      const improvements: string[] = [];

      if (!code.trim() || code.includes('write your solution here') || code.includes('pass')) {
        mistakes.push(`Question was left incomplete in ${lang.toUpperCase()}.`);
        improvements.push(`Review foundational patterns for ${challenge.category} in ${lang.toUpperCase()}.`);
      } else if (execution.error) {
        mistakes.push(`Runtime/Syntax error in ${lang}: ${execution.error}`);
        improvements.push(`Check syntax and parameter definitions for ${lang.toUpperCase()}.`);
      } else if (failedCases.length > 0) {
        mistakes.push(`Failed ${failedCases.length} out of ${allCases.length} test cases (edge cases missed).`);
        if (failedCases[0]?.error) {
          mistakes.push(failedCases[0].error);
        }
        improvements.push(`Refine ${lang} logic for boundary conditions and optimize for ${challenge.timeComplexity || 'O(N)'}.`);
      } else {
        improvements.push(`Excellent! 100% test cases passed cleanly in ${lang.toUpperCase()}.`);
      }

      const { optimalSolutions } = this.getMultiLanguageTemplates(challenge.slug, functionName);
      const optimalSolution = optimalSolutions[lang] || optimalSolutions['typescript'] || challenge.optimalCode;

      questionResults.push({
        challengeId: challenge.id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        role: (challenge as any).role || 'Software Engineer',
        level: (challenge as any).level || 'Junior',
        submittedCode: code,
        language: lang,
        passed: execution.allPassed,
        passedTests: execution.passedTests,
        totalTests: execution.totalTests,
        score: questionScore,
        maxScore: maxScorePerQuestion,
        executionTimeMs: execution.executionTimeMs,
        expectedComplexity: {
          time: challenge.timeComplexity || 'O(N)',
          space: challenge.spaceComplexity || 'O(1)',
        },
        optimalSolution,
        mistakes,
        improvements,
      });

      await prisma.codingSubmission.create({
        data: {
          userId,
          challengeId: challenge.id,
          code: code || '// Empty submission',
          language: lang,
          status: execution.allPassed ? 'ACCEPTED' : (failedCases.length > 0 ? 'WRONG_ANSWER' : 'RUNTIME_ERROR'),
          score: questionScore,
          output: `Passed ${execution.passedTests}/${execution.totalTests} test cases in ${lang.toUpperCase()}.`,
        },
      });
    }

    const passed = totalScore >= 70;
    const grade = totalScore >= 90 ? 'A (Distinction)' : totalScore >= 80 ? 'B+ (Merit)' : totalScore >= 70 ? 'B (Pass)' : 'Needs Improvement';

    const overallFeedback = {
      overallScore: totalScore,
      passed,
      grade,
      role: assessment.role,
      level: assessment.difficulty,
      summary: passed
        ? `Impressive technical performance for ${assessment.role} (${assessment.difficulty})! You achieved ${totalScore}/100, passing the assessment threshold.`
        : `Assessment completed for ${assessment.role} (${assessment.difficulty}) with ${totalScore}/100. Target skill gaps identified.`,
      strengths: questionResults.filter(q => q.passed).map(q => `Solved ${q.title} (${q.category}) in ${q.language.toUpperCase()}`),
      actionableAdvice: [
        'Always check boundary cases (empty inputs, negative values, single elements) before coding.',
        'Target optimal time complexity rather than quadratic brute-force.',
        'Study the provided Optimal Solutions in your chosen language below.',
      ],
      questionBreakdown: questionResults,
    };

    const updated = await (prisma as any).technicalAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'COMPLETED',
        totalScore,
        passed,
        feedback: JSON.stringify(overallFeedback),
        userAnswers: JSON.stringify(answers),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        readinessScore: Math.min(100, Math.max(50, Math.round((totalScore + 75) / 2))),
      },
    });

    return {
      assessmentId: updated.id,
      overallScore: totalScore,
      passed,
      grade,
      feedback: overallFeedback,
    };
  }

  /**
   * Retrieves an assessment by ID
   */
  static async getTechnicalAssessment(userId: string, assessmentId: string) {
    const assessment = await (prisma as any).technicalAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw ApiError.notFound('Assessment not found.');
    }

    if (assessment.userId !== userId) {
      throw ApiError.forbidden('Unauthorized access to assessment.');
    }

    return {
      id: assessment.id,
      status: assessment.status,
      totalScore: assessment.totalScore,
      passed: assessment.passed,
      feedback: assessment.feedback ? JSON.parse(assessment.feedback) : null,
      createdAt: assessment.createdAt,
    };
  }

  /**
   * Legacy single-challenge submission method
   */
  static async submitCode(dto: CodeSubmissionDTO) {
    const challenge = await prisma.codingChallenge.findUnique({
      where: { id: dto.challengeId },
    });

    if (!challenge) {
      throw ApiError.notFound('Challenge not found.');
    }

    const execution = await this.runAllTests(dto.challengeId, dto.code, dto.language);
    const status = execution.allPassed ? 'ACCEPTED' : 'WRONG_ANSWER';
    const score = Math.round((execution.passedTests / Math.max(1, execution.totalTests)) * 100);
    const output = `Passed ${execution.passedTests}/${execution.totalTests} test cases in ${dto.language.toUpperCase()}.`;

    const submission = await prisma.codingSubmission.create({
      data: {
        userId: dto.userId,
        challengeId: dto.challengeId,
        code: dto.code,
        language: dto.language,
        status,
        score,
        output,
      },
    });

    return {
      submission,
      status,
      score,
      output,
      results: execution.results,
    };
  }

  /**
   * Seeds 18 Enterprise-grade challenges across Roles (SE, DevOps, QA) and Levels (Internship, Junior, Senior)
   */
  static async seedInitialChallenges() {
    const challenges = [
      // --- INTERNSHIP / TRAINEE (FOUNDATIONAL & LOGIC) ---
      {
        title: 'Custom FizzBuzz Classifier',
        slug: 'fizz-buzz-classifier',
        category: 'Logic & Control Flow',
        difficulty: 'Easy',
        role: 'All',
        level: 'Internship',
        functionName: 'fizzBuzz',
        description: 'Given an integer n, return:\n• "FizzBuzz" if n is divisible by both 3 and 5\n• "Fizz" if n is divisible by 3\n• "Buzz" if n is divisible by 5\n• String(n) if none of the above are true.',
        starterCode: 'function fizzBuzz(n: number): string {\n  // return string\n  return "";\n}',
        testCases: JSON.stringify({
          sample: [
            { input: 15, expected: 'FizzBuzz' },
            { input: 3, expected: 'Fizz' },
            { input: 5, expected: 'Buzz' },
            { input: 7, expected: '7' },
          ],
          hidden: [
            { input: 30, expected: 'FizzBuzz' },
            { input: 9, expected: 'Fizz' },
            { input: 10, expected: 'Buzz' },
            { input: 2, expected: '2' },
          ],
        }),
        hints: JSON.stringify(['Check for n % 15 === 0 first before 3 or 5!']),
        optimalCode: 'function fizzBuzz(n: number): string {\n  if (n % 15 === 0) return "FizzBuzz";\n  if (n % 3 === 0) return "Fizz";\n  if (n % 5 === 0) return "Buzz";\n  return String(n);\n}',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '96%',
      },
      {
        title: 'Vowel Counter & Sanitizer',
        slug: 'count-vowels',
        category: 'Strings',
        difficulty: 'Easy',
        role: 'All',
        level: 'Internship',
        functionName: 'countVowels',
        description: 'Given a string s, return the total count of vowels (a, e, i, o, u) regardless of whether they are uppercase or lowercase.',
        starterCode: 'function countVowels(s: string): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: 'hello world', expected: 3 },
            { input: 'AEIOU', expected: 5 },
            { input: 'rhythm', expected: 0 },
          ],
          hidden: [
            { input: 'Enterprise AI Preparation', expected: 11 },
            { input: '', expected: 0 },
          ],
        }),
        hints: JSON.stringify(['Convert string to lowercase and check against a set of vowels.']),
        optimalCode: 'function countVowels(s: string): number {\n  const m = s.match(/[aeiou]/gi);\n  return m ? m.length : 0;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '94%',
      },
      {
        title: 'Sum of Digits',
        slug: 'sum-of-digits',
        category: 'Math',
        difficulty: 'Easy',
        role: 'All',
        level: 'Internship',
        functionName: 'sumOfDigits',
        description: 'Given an integer n, calculate and return the sum of all its digits. Negative numbers should be treated as positive values (e.g. -123 becomes 1 + 2 + 3 = 6).',
        starterCode: 'function sumOfDigits(n: number): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: 123, expected: 6 },
            { input: -456, expected: 15 },
            { input: 0, expected: 0 },
          ],
          hidden: [
            { input: 9999, expected: 36 },
            { input: 100001, expected: 2 },
          ],
        }),
        hints: JSON.stringify(['Use Math.abs(n) and extract digits with % 10.']),
        optimalCode: 'function sumOfDigits(n: number): number {\n  n = Math.abs(n);\n  let s = 0;\n  while (n > 0) { s += n % 10; n = Math.floor(n / 10); }\n  return s;\n}',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '92%',
      },

      // --- DEVOPS & CLOUD TASKS ---
      {
        title: 'IPv4 Address Validator',
        slug: 'valid-ip-checker',
        category: 'Networking',
        difficulty: 'Easy',
        role: 'DevOps',
        level: 'Junior',
        functionName: 'isValidIP',
        description: 'In cloud networking, valid IPv4 addresses must contain exactly 4 dot-separated decimal octets. Each octet must be between 0 and 255 with no leading zeros (e.g. "192.168.1.1" is valid, while "192.168.01.1" and "256.1.1.1" are invalid). Write a function to validate an IP address string.',
        starterCode: 'function isValidIP(ip: string): boolean {\n  // return boolean\n  return false;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: '192.168.1.1', expected: true },
            { input: '256.100.0.1', expected: false },
            { input: '192.168.01.1', expected: false },
          ],
          hidden: [
            { input: '0.0.0.0', expected: true },
            { input: '255.255.255.255', expected: true },
            { input: '10.0.0', expected: false },
            { input: '10.0.0.a', expected: false },
          ],
        }),
        hints: JSON.stringify(['Split by dot and ensure exactly 4 parts.', 'Ensure no leading zeros if string length > 1.']),
        optimalCode: 'function isValidIP(ip: string): boolean {\n  const parts = ip.split(".");\n  if (parts.length !== 4) return false;\n  for (const p of parts) {\n    if (!p || isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255) return false;\n    if (p.length > 1 && p.startsWith("0")) return false;\n  }\n  return true;\n}',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '78%',
      },
      {
        title: 'HTTP 5xx Server Error Parser',
        slug: 'parse-log-5xx',
        category: 'Log Analysis',
        difficulty: 'Easy',
        role: 'DevOps',
        level: 'Junior',
        functionName: 'countServerErrors',
        description: 'Given an array of raw server access log lines, count how many log entries indicate an HTTP 5xx Server Error (500, 502, 503, or 504). Example log line:\n"GET /api/checkout 500 120ms - Mozilla/5.0"',
        starterCode: 'function countServerErrors(logs: string[]): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: ['GET /api/v1 200 45ms', 'POST /checkout 500 120ms', 'GET /health 503 10ms'], expected: 2 },
            { input: ['GET /index.html 200 15ms', 'POST /auth/login 401 22ms'], expected: 0 },
          ],
          hidden: [
            { input: ['502 Bad Gateway', '504 Gateway Timeout', '200 OK', '500 Internal Error'], expected: 3 },
            { input: [], expected: 0 },
          ],
        }),
        hints: JSON.stringify(['Check for regex pattern /\\b(500|502|503|504)\\b/ in each line.']),
        optimalCode: 'function countServerErrors(logs: string[]): number {\n  const reg = /\\b(500|502|503|504)\\b/;\n  return logs.filter(l => reg.test(l)).length;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '88%',
      },
      {
        title: 'Semantic Version Comparator',
        slug: 'semver-comparator',
        category: 'Release Engineering',
        difficulty: 'Medium',
        role: 'DevOps',
        level: 'Senior',
        functionName: 'compareVersion',
        description: 'Given two version strings v1 and v2 (e.g. "1.2.0" and "1.10.1"), compare them.\nReturn:\n• 1 if v1 > v2\n• -1 if v1 < v2\n• 0 if v1 == v2\nTreat missing revisions as 0 (e.g. "1.0" equals "1.0.0").',
        starterCode: 'function compareVersion(v1: string, v2: string): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: { v1: '1.2.0', v2: '1.10.1' }, expected: -1 },
            { input: { v1: '2.0.1', v2: '1.9.9' }, expected: 1 },
            { input: { v1: '1.0', v2: '1.0.0' }, expected: 0 },
          ],
          hidden: [
            { input: { v1: '0.1', v2: '1.1' }, expected: -1 },
            { input: { v1: '1.01', v2: '1.001' }, expected: 0 },
          ],
        }),
        hints: JSON.stringify(['Split both by dot, parse integers, and pad the shorter array with 0s.']),
        optimalCode: 'function compareVersion(v1: string, v2: string): number {\n  const p1 = v1.split(".").map(Number);\n  const p2 = v2.split(".").map(Number);\n  const max = Math.max(p1.length, p2.length);\n  for (let i = 0; i < max; i++) {\n    const a = p1[i] || 0; const b = p2[i] || 0;\n    if (a > b) return 1;\n    if (a < b) return -1;\n  }\n  return 0;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        acceptanceRate: '75%',
      },

      // --- QA & AUTOMATION TESTING TASKS ---
      {
        title: 'API JSON Schema Assertion Validator',
        slug: 'api-schema-validator',
        category: 'Automation Testing',
        difficulty: 'Easy',
        role: 'QA Engineer',
        level: 'Junior',
        functionName: 'validateSchema',
        description: 'In automated test assertions, verifying that an API response contains all mandatory contract keys is crucial. Write a function that returns true if payload has all requiredKeys and none of them are null or undefined.',
        starterCode: 'function validateSchema(payload: Record<string, any>, requiredKeys: string[]): boolean {\n  return false;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: { payload: { id: 101, name: 'Candidate', status: 'ACTIVE' }, requiredKeys: ['id', 'name'] }, expected: true },
            { input: { payload: { id: 102, name: null }, requiredKeys: ['id', 'name'] }, expected: false },
            { input: { payload: { id: 103 }, requiredKeys: ['id', 'email'] }, expected: false },
          ],
          hidden: [
            { input: { payload: {}, requiredKeys: ['status'] }, expected: false },
            { input: { payload: { age: 0, ready: false }, requiredKeys: ['age', 'ready'] }, expected: true },
          ],
        }),
        hints: JSON.stringify(['Remember that 0 and false are valid values! Check strictly for null and undefined.']),
        optimalCode: 'function validateSchema(payload: Record<string, any>, requiredKeys: string[]): boolean {\n  if (!payload || typeof payload !== "object") return false;\n  for (const k of requiredKeys) {\n    if (payload[k] === undefined || payload[k] === null) return false;\n  }\n  return true;\n}',
        timeComplexity: 'O(K)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '87%',
      },
      {
        title: 'Boundary Value Partition Checker',
        slug: 'boundary-partition-checker',
        category: 'Boundary Value Testing',
        difficulty: 'Easy',
        role: 'QA Engineer',
        level: 'Junior',
        functionName: 'isWithinBoundary',
        description: 'In QA test generation, Equivalence Partitioning & Boundary Value Analysis (BVA) test boundary limits. Given a candidate numeric input val, and inclusive range boundaries minVal and maxVal, return true if val is valid (minVal <= val <= maxVal), otherwise false.',
        starterCode: 'function isWithinBoundary(val: number, minVal: number, maxVal: number): boolean {\n  return false;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: { val: 50, minVal: 18, maxVal: 65 }, expected: true },
            { input: { val: 18, minVal: 18, maxVal: 65 }, expected: true },
            { input: { val: 17, minVal: 18, maxVal: 65 }, expected: false },
            { input: { val: 66, minVal: 18, maxVal: 65 }, expected: false },
          ],
          hidden: [
            { input: { val: 65, minVal: 18, maxVal: 65 }, expected: true },
            { input: { val: -5, minVal: 0, maxVal: 100 }, expected: false },
          ],
        }),
        hints: JSON.stringify(['Verify both inclusive conditions: val >= minVal && val <= maxVal.']),
        optimalCode: 'function isWithinBoundary(val: number, minVal: number, maxVal: number): boolean {\n  return val >= minVal && val <= maxVal;\n}',
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '98%',
      },
      {
        title: 'Automated Test ID Slug Generator',
        slug: 'generate-test-slug',
        category: 'Test Automation',
        difficulty: 'Easy',
        role: 'QA Engineer',
        level: 'Junior',
        functionName: 'generateTestSlug',
        description: 'Automated UI test scripts (Cypress / Playwright) require reliable data-testid slugs from user story names. Given an arbitrary title string (e.g. "Submit Button [Primary] #1"), convert it into a lowercase kebab-case slug ("submit-button-primary-1") by replacing all non-alphanumeric characters with a single hyphen and stripping leading/trailing hyphens.',
        starterCode: 'function generateTestSlug(title: string): string {\n  return "";\n}',
        testCases: JSON.stringify({
          sample: [
            { input: 'Submit Button [Primary]', expected: 'submit-button-primary' },
            { input: 'User Profile - Settings (v2)', expected: 'user-profile-settings-v2' },
          ],
          hidden: [
            { input: '   ---Special %% Chars---   ', expected: 'special-chars' },
            { input: 'SingleWord', expected: 'singleword' },
          ],
        }),
        hints: JSON.stringify(['Use toLowerCase(), replace(/[^a-z0-9]+/g, "-"), and trim hyphens.']),
        optimalCode: 'function generateTestSlug(title: string): string {\n  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        acceptanceRate: '86%',
      },

      // --- SOFTWARE ENGINEER (ALGORITHMS & DATA STRUCTURES) ---
      {
        title: 'Two Sum Problem',
        slug: 'two-sum',
        category: 'Algorithms',
        difficulty: 'Easy',
        role: 'Software Engineer',
        level: 'Junior',
        functionName: 'twoSum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
        starterCode: 'function twoSum(nums: number[], target: number): number[] {\n  // write your solution here\n  return [];\n}',
        testCases: JSON.stringify({
          sample: [
            { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
            { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
          ],
          hidden: [
            { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
            { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected: [2, 4] },
          ],
        }),
        hints: JSON.stringify(['Use a hash map to look up the complement in O(1) time.']),
        optimalCode: 'function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        acceptanceRate: '88%',
      },
      {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        category: 'Data Structures',
        difficulty: 'Easy',
        role: 'Software Engineer',
        level: 'Junior',
        functionName: 'isValid',
        description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
        starterCode: 'function isValid(s: string): boolean {\n  return false;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: '()', expected: true },
            { input: '()[]{}', expected: true },
            { input: '(]', expected: false },
          ],
          hidden: [
            { input: '([)]', expected: false },
            { input: '{[]}', expected: true },
          ],
        }),
        hints: JSON.stringify(['Use a stack (LIFO) to match brackets.']),
        optimalCode: 'function isValid(s: string): boolean {\n  const stack: string[] = [];\n  const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };\n  for (const char of s) {\n    if (char === "(" || char === "{" || char === "[") stack.push(char);\n    else if (!stack.length || stack.pop() !== pairs[char]) return false;\n  }\n  return stack.length === 0;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        acceptanceRate: '82%',
      },
      {
        title: 'Best Time to Buy and Sell Stock',
        slug: 'best-time-to-buy-stock',
        category: 'Algorithms',
        difficulty: 'Easy',
        role: 'Software Engineer',
        level: 'Junior',
        functionName: 'maxProfit',
        description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Return the maximum profit you can achieve.',
        starterCode: 'function maxProfit(prices: number[]): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: [7, 1, 5, 3, 6, 4], expected: 5 },
            { input: [7, 6, 4, 3, 1], expected: 0 },
          ],
          hidden: [
            { input: [2, 4, 1], expected: 2 },
            { input: [3, 2, 6, 5, 0, 3], expected: 4 },
          ],
        }),
        hints: JSON.stringify(['Keep track of minimum price seen so far.']),
        optimalCode: 'function maxProfit(prices: number[]): number {\n  let minP = Infinity, maxP = 0;\n  for (const p of prices) {\n    if (p < minP) minP = p;\n    else if (p - minP > maxP) maxP = p - minP;\n  }\n  return maxP;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '79%',
      },
      {
        title: 'Maximum Subarray (Kadane)',
        slug: 'maximum-subarray',
        category: 'Algorithms',
        difficulty: 'Medium',
        role: 'Software Engineer',
        level: 'Senior',
        functionName: 'maxSubArray',
        description: 'Given an integer array nums, find the contiguous subarray with the largest sum and return its sum.',
        starterCode: 'function maxSubArray(nums: number[]): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: [-2, 1, -3, 4, -1, 2, 1, -5, 4], expected: 6 },
            { input: [1], expected: 1 },
            { input: [5, 4, -1, 7, 8], expected: 23 },
          ],
          hidden: [
            { input: [-1, -2, -3], expected: -1 },
          ],
        }),
        hints: JSON.stringify(['Kadane\'s algorithm solves this in a single pass.']),
        optimalCode: 'function maxSubArray(nums: number[]): number {\n  let cur = nums[0], maxS = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    cur = Math.max(nums[i], cur + nums[i]);\n    maxS = Math.max(maxS, cur);\n  }\n  return maxS;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '74%',
      },
      {
        title: 'Merge Intervals',
        slug: 'merge-intervals',
        category: 'Algorithms',
        difficulty: 'Medium',
        role: 'Software Engineer',
        level: 'Senior',
        functionName: 'merge',
        description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.',
        starterCode: 'function merge(intervals: number[][]): number[][] {\n  return [];\n}',
        testCases: JSON.stringify({
          sample: [
            { input: [[1, 3], [2, 6], [8, 10], [15, 18]], expected: [[1, 6], [8, 10], [15, 18]] },
            { input: [[1, 4], [4, 5]], expected: [[1, 5]] },
          ],
          hidden: [
            { input: [[1, 4], [0, 4]], expected: [[0, 4]] },
          ],
        }),
        hints: JSON.stringify(['Sort intervals by start time first.']),
        optimalCode: 'function merge(intervals: number[][]): number[][] {\n  if (intervals.length <= 1) return intervals;\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const cur = intervals[i];\n    const last = merged[merged.length - 1];\n    if (cur[0] <= last[1]) last[1] = Math.max(last[1], cur[1]);\n    else merged.push(cur);\n  }\n  return merged;\n}',
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N)',
        acceptanceRate: '68%',
      },
      {
        title: 'Binary Search',
        slug: 'binary-search',
        category: 'Algorithms',
        difficulty: 'Easy',
        role: 'Software Engineer',
        level: 'Junior',
        functionName: 'search',
        description: 'Given an array of integers nums sorted in ascending order and a target, return index if target exists, else -1 in O(log N) time.',
        starterCode: 'function search(nums: number[], target: number): number {\n  return -1;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expected: 4 },
            { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expected: -1 },
          ],
          hidden: [
            { input: { nums: [5], target: 5 }, expected: 0 },
          ],
        }),
        hints: JSON.stringify(['Use two pointers left and right, and check mid element.']),
        optimalCode: 'function search(nums: number[], target: number): number {\n  let l = 0, r = nums.length - 1;\n  while (l <= r) {\n    const m = Math.floor(l + (r - l) / 2);\n    if (nums[m] === target) return m;\n    if (nums[m] < target) l = m + 1;\n    else r = m - 1;\n  }\n  return -1;\n}',
        timeComplexity: 'O(log N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '91%',
      },
      {
        title: 'Container With Most Water',
        slug: 'container-with-most-water',
        category: 'Algorithms',
        difficulty: 'Medium',
        role: 'Software Engineer',
        level: 'Senior',
        functionName: 'maxArea',
        description: 'Given an array height of length n, find two lines that together with x-axis form a container containing the most water.',
        starterCode: 'function maxArea(height: number[]): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: [1, 8, 6, 2, 5, 4, 8, 3, 7], expected: 49 },
            { input: [1, 1], expected: 1 },
          ],
          hidden: [
            { input: [4, 3, 2, 1, 4], expected: 16 },
          ],
        }),
        hints: JSON.stringify(['Two pointers starting at both ends. Move the pointer pointing to shorter line.']),
        optimalCode: 'function maxArea(height: number[]): number {\n  let l = 0, r = height.length - 1, maxW = 0;\n  while (l < r) {\n    const h = Math.min(height[l], height[r]);\n    maxW = Math.max(maxW, h * (r - l));\n    if (height[l] < height[r]) l++; else r--;\n  }\n  return maxW;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '65%',
      },
      {
        title: 'Climbing Stairs',
        slug: 'climbing-stairs',
        category: 'Dynamic Programming',
        difficulty: 'Easy',
        role: 'Software Engineer',
        level: 'Junior',
        functionName: 'climbStairs',
        description: 'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach top?',
        starterCode: 'function climbStairs(n: number): number {\n  return 0;\n}',
        testCases: JSON.stringify({
          sample: [
            { input: 2, expected: 2 },
            { input: 3, expected: 3 },
          ],
          hidden: [
            { input: 4, expected: 5 },
            { input: 5, expected: 8 },
          ],
        }),
        hints: JSON.stringify(['Follows Fibonacci pattern: ways(n) = ways(n-1) + ways(n-2).']),
        optimalCode: 'function climbStairs(n: number): number {\n  if (n <= 2) return n;\n  let a = 1, b = 2;\n  for (let i = 3; i <= n; i++) {\n    const c = a + b; a = b; b = c;\n  }\n  return b;\n}',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        acceptanceRate: '89%',
      },
    ];

    for (const challenge of challenges) {
      await (prisma.codingChallenge as any).upsert({
        where: { slug: challenge.slug },
        update: challenge,
        create: challenge,
      });
    }
  }
}
