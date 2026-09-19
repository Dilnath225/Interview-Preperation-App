# Coding Interview Patterns — Complete Reference

## Top 20 Coding Patterns for Interviews

### Pattern 1: Two Pointers
**When to use**: Sorted arrays, finding pairs, removing duplicates, palindromes
**Template**:
```python
def two_pointers(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        current_sum = arr[left] + arr[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
```
**Common problems**: Two Sum (sorted), Container With Most Water, 3Sum, Remove Duplicates
**Complexity**: O(n) time, O(1) space

### Pattern 2: Sliding Window
**When to use**: Contiguous subarray/substring problems with a constraint
**Template**:
```python
def sliding_window(arr, k):
    window_start = 0
    window_sum = 0
    max_sum = 0
    for window_end in range(len(arr)):
        window_sum += arr[window_end]
        if window_end >= k - 1:
            max_sum = max(max_sum, window_sum)
            window_sum -= arr[window_start]
            window_start += 1
    return max_sum
```
**Common problems**: Maximum Sum Subarray of Size K, Longest Substring Without Repeating Characters, Minimum Window Substring
**Complexity**: O(n) time, O(1) or O(k) space

### Pattern 3: Fast & Slow Pointers (Floyd's Cycle Detection)
**When to use**: Linked list cycles, finding middle of list, happy numbers
**Template**:
```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False
```
**Common problems**: Linked List Cycle, Find Middle of Linked List, Happy Number, Find the Duplicate Number
**Complexity**: O(n) time, O(1) space

### Pattern 4: Merge Intervals
**When to use**: Overlapping intervals, scheduling, time ranges
**Template**:
```python
def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        if current[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], current[1])
        else:
            merged.append(current)
    return merged
```
**Common problems**: Merge Intervals, Insert Interval, Meeting Rooms, Interval List Intersections
**Complexity**: O(n log n) time, O(n) space

### Pattern 5: Binary Search
**When to use**: Sorted arrays, search space reduction, finding boundaries
**Template**:
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
```
**Common problems**: Search in Rotated Sorted Array, Find Peak Element, Search a 2D Matrix
**Complexity**: O(log n) time, O(1) space

### Pattern 6: BFS (Breadth-First Search)
**When to use**: Shortest path in unweighted graph, level-order traversal, connected components
**Template**:
```python
from collections import deque
def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```
**Common problems**: Binary Tree Level Order Traversal, Number of Islands, Shortest Path in Binary Matrix, Word Ladder
**Complexity**: O(V + E) time, O(V) space

### Pattern 7: DFS (Depth-First Search)
**When to use**: Path finding, cycle detection, topological sort, tree traversals
**Template**:
```python
def dfs(graph, node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
```
**Common problems**: Number of Islands, Clone Graph, Path Sum, Course Schedule
**Complexity**: O(V + E) time, O(V) space

### Pattern 8: Top K Elements (Heap)
**When to use**: Finding K largest/smallest/most frequent elements
**Template**:
```python
import heapq
def top_k_elements(nums, k):
    return heapq.nlargest(k, nums)
    # Or use min-heap of size k for better memory:
    # heap = nums[:k]
    # heapq.heapify(heap)
    # for num in nums[k:]:
    #     if num > heap[0]:
    #         heapq.heapreplace(heap, num)
    # return heap
```
**Common problems**: Kth Largest Element, Top K Frequent Elements, K Closest Points to Origin
**Complexity**: O(n log k) time, O(k) space

### Pattern 9: Dynamic Programming (Memoization)
**When to use**: Overlapping subproblems, optimal substructure
**Template**:
```python
def dp_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = dp_memo(n-1, memo) + dp_memo(n-2, memo)
    return memo[n]
```
**Common problems**: Fibonacci, Climbing Stairs, Coin Change, Longest Common Subsequence, House Robber, Edit Distance
**Complexity**: Depends on problem, typically reduces exponential to polynomial

### Pattern 10: Backtracking
**When to use**: Permutations, combinations, subsets, constraint satisfaction
**Template**:
```python
def backtrack(candidates, target, current, start, result):
    if target == 0:
        result.append(current[:])
        return
    for i in range(start, len(candidates)):
        if candidates[i] > target:
            break
        current.append(candidates[i])
        backtrack(candidates, target - candidates[i], current, i + 1, result)
        current.pop()
```
**Common problems**: Subsets, Permutations, Combination Sum, N-Queens, Sudoku Solver, Word Search
**Complexity**: Often exponential O(2^n) or O(n!), but pruning helps

### Pattern 11: Monotonic Stack
**When to use**: Next greater/smaller element, histogram problems
**Common problems**: Daily Temperatures, Next Greater Element, Largest Rectangle in Histogram
**Complexity**: O(n) time, O(n) space

### Pattern 12: Union Find (Disjoint Set)
**When to use**: Connected components, cycle detection in undirected graphs, grouping
**Common problems**: Number of Provinces, Accounts Merge, Redundant Connection
**Complexity**: O(α(n)) per operation (nearly O(1) amortized)

### Pattern 13: Trie (Prefix Tree)
**When to use**: Autocomplete, spell check, prefix matching, word search in matrix
**Common problems**: Implement Trie, Word Search II, Design Add and Search Words
**Complexity**: O(word_length) for insert/search

### Pattern 14: Greedy
**When to use**: Local optimal choice leads to global optimal
**Common problems**: Jump Game, Task Scheduler, Partition Labels, Minimum Number of Arrows
**Complexity**: Usually O(n log n) due to sorting

### Pattern 15: Bit Manipulation
**When to use**: Finding single number, power of 2, counting bits
**Key operations**: AND (&), OR (|), XOR (^), NOT (~), Left Shift (<<), Right Shift (>>)
**Common problems**: Single Number, Number of 1 Bits, Power of Two, Missing Number
**Complexity**: O(1) per operation

---

## Problem-Solving Framework for Coding Interviews

### Step 1: Understand (2-3 minutes)
- Restate the problem in your own words
- Ask clarifying questions: input constraints, edge cases, expected output
- Work through 1-2 examples by hand

### Step 2: Plan (3-5 minutes)
- Identify the pattern (Two Pointers? DP? BFS?)
- Discuss brute force approach first, then optimize
- State time and space complexity of your approach
- Get interviewer's agreement before coding

### Step 3: Code (10-15 minutes)
- Write clean, readable code with meaningful variable names
- Handle edge cases (empty input, single element, duplicates)
- Use helper functions for clarity
- Talk through your code as you write

### Step 4: Verify (3-5 minutes)
- Trace through your code with the example inputs
- Check edge cases
- Verify time and space complexity
- Ask if the interviewer has any follow-up optimizations

---

## Common Mistakes in Coding Interviews

1. **Jumping straight to code**: Always discuss approach first
2. **Not handling edge cases**: Empty arrays, null inputs, single elements
3. **Off-by-one errors**: Careful with loop boundaries and array indices
4. **Not communicating**: Think aloud, explain your reasoning
5. **Over-engineering**: Start simple, optimize if asked
6. **Forgetting to test**: Always trace through your solution with examples
7. **Panicking on hard problems**: Break down into smaller subproblems
