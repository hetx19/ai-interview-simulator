import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INITIAL_PROBLEMS = [
  {
    title: "Pair Sum Index Locator",
    difficulty: "easy",
    topic: "arrays",
    description:
      "You are given an integer array `values` and a target integer `goal`. Find two distinct indices `i` and `j` in the array such that `values[i] + values[j] == goal`.\n\nReturn the pair of indices as an array `[i, j]`. You may assume each input has exactly one valid pair, and the same element cannot be used twice. The indices may be returned in any order.",
    optimalTimeComplexity: "O(n)",
    optimalSpaceComplexity: "O(n)",
    tags: ["arrays", "hash-table", "two-pointers"],
    constraints: [
      "2 <= values.length <= 10^4",
      "-10^9 <= values[i] <= 10^9",
      "-10^9 <= goal <= 10^9",
      "Exactly one valid pair of indices exists.",
    ],
    examples: [
      {
        input: "values = [2,7,11,15], goal = 9",
        output: "[0,1]",
        explanation: "values[0] + values[1] == 2 + 7 == 9, so we return [0, 1].",
      },
      {
        input: "values = [3,2,4], goal = 6",
        output: "[1,2]",
        explanation: "values[1] + values[2] == 2 + 4 == 6, so we return [1, 2].",
      },
    ],
    testCasesVisible: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expected_output: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expected_output: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expected_output: [0, 1] },
    ],
    testCasesHidden: [
      { input: { nums: [-1, -2, -3, -4, -5], target: -8 }, expected_output: [2, 4] },
      { input: { nums: [0, 4, 3, 0], target: 0 }, expected_output: [0, 3] },
    ],
    hints: [
      { level: 1, text: "Consider storing previously visited values in a hash map for O(1) complement lookups." },
      { level: 2, text: "For each element x, check whether (goal - x) has already been recorded and retrieve its index." },
    ],
    isActive: true,
  },
  {
    title: "Bounded LRU Cache Structure",
    difficulty: "medium",
    topic: "data-structures",
    description:
      "Design a fixed-capacity key-value store that evicts the least recently used entry when the capacity limit is exceeded.\n\nImplement the `BoundedCache` class:\n- `BoundedCache(int capacity)` — Initializes the cache with a positive capacity.\n- `int get(int key)` — Returns the value mapped to `key` if it exists in the cache (marking it as recently used), or `-1` if the key is absent.\n- `void put(int key, int value)` — Inserts or updates the key-value pair. If inserting causes the cache to exceed its capacity, the least recently accessed entry must be evicted before the new entry is stored.\n\nBoth `get` and `put` must operate in O(1) average time complexity.",
    optimalTimeComplexity: "O(1)",
    optimalSpaceComplexity: "O(capacity)",
    tags: ["hash-table", "linked-list", "doubly-linked-list", "design"],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put.",
    ],
    examples: [
      {
        input:
          '["BoundedCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
        explanation: "After inserting keys 1 and 2, accessing key 1 refreshes it. Inserting key 3 evicts key 2 (least recently used). Inserting key 4 evicts key 1. Final lookups confirm eviction order.",
      },
    ],
    testCasesVisible: [
      {
        input: {
          operations: ["put", "put", "get", "put", "get"],
          capacity: 2,
          args: [[1, 10], [2, 20], [1], [3, 30], [2]],
        },
        expected_output: [null, null, 10, null, -1],
      },
    ],
    testCasesHidden: [
      {
        input: {
          operations: ["put", "get", "put", "get", "get"],
          capacity: 1,
          args: [[2, 1], [2], [3, 2], [2], [3]],
        },
        expected_output: [null, 1, null, -1, 2],
      },
    ],
    hints: [
      { level: 1, text: "Pair a hash map (for O(1) key lookup) with a doubly linked list (for O(1) insertion and removal)." },
      { level: 2, text: "Maintain the most recently accessed node at the head and the least recently used at the tail. On eviction, remove the tail node." },
    ],
    isActive: true,
  },
  {
    title: "Minimum Denomination Exchange",
    difficulty: "medium",
    topic: "dp",
    description:
      "You are given an array of positive integers `denominations`, each representing a coin denomination with unlimited supply, and a non-negative integer `target` representing the total amount you need to assemble.\n\nReturn the minimum number of coins required to form the exact `target` amount. If no combination of the given denominations can produce the target, return `-1`.\n\nYou may use each denomination as many times as needed.",
    optimalTimeComplexity: "O(target * denominations.length)",
    optimalSpaceComplexity: "O(target)",
    tags: ["dynamic-programming", "bfs"],
    constraints: [
      "1 <= denominations.length <= 12",
      "1 <= denominations[i] <= 2^31 - 1",
      "0 <= target <= 10^4",
    ],
    examples: [
      {
        input: "denominations = [1,2,5], target = 11",
        output: "3",
        explanation: "11 = 5 + 5 + 1 uses 3 coins, which is the minimum possible.",
      },
      {
        input: "denominations = [2], target = 3",
        output: "-1",
        explanation: "There is no way to combine denomination 2 to reach exactly 3.",
      },
    ],
    testCasesVisible: [
      { input: { coins: [1, 2, 5], amount: 11 }, expected_output: 3 },
      { input: { coins: [2], amount: 3 }, expected_output: -1 },
      { input: { coins: [1], amount: 0 }, expected_output: 0 },
    ],
    testCasesHidden: [
      { input: { coins: [186, 419, 83, 408], amount: 6249 }, expected_output: 20 },
      { input: { coins: [2, 5, 10, 1], amount: 27 }, expected_output: 4 },
    ],
    hints: [
      { level: 1, text: "Build a solution bottom-up: define dp[i] as the fewest coins needed to form amount i." },
      { level: 2, text: "For each amount i, try every denomination d and set dp[i] = min(dp[i], dp[i - d] + 1) when i - d >= 0." },
    ],
    isActive: true,
  },
  {
    title: "Topological Dependency Resolver",
    difficulty: "medium",
    topic: "graphs",
    description:
      "You are managing a build system with `numTasks` tasks labeled from `0` to `numTasks - 1`. Some tasks depend on others: `dependencies[i] = [a, b]` means task `b` must complete before task `a` can begin.\n\nDetermine whether it is possible to complete all tasks. Return `true` if a valid execution order exists, or `false` if circular dependencies make completion impossible.",
    optimalTimeComplexity: "O(V + E)",
    optimalSpaceComplexity: "O(V + E)",
    tags: ["graphs", "dfs", "bfs", "topological-sort"],
    constraints: [
      "1 <= numTasks <= 2000",
      "0 <= dependencies.length <= 5000",
      "dependencies[i].length == 2",
      "0 <= a, b < numTasks",
      "All dependency pairs [a, b] are unique.",
    ],
    examples: [
      {
        input: "numTasks = 2, dependencies = [[1,0]]",
        output: "true",
        explanation: "Task 0 has no dependencies and executes first, then task 1 can proceed.",
      },
      {
        input: "numTasks = 2, dependencies = [[1,0],[0,1]]",
        output: "false",
        explanation: "Task 0 depends on task 1 and vice versa — a circular dependency makes completion impossible.",
      },
    ],
    testCasesVisible: [
      { input: { numCourses: 2, prerequisites: [[1, 0]] }, expected_output: true },
      { input: { numCourses: 2, prerequisites: [[1, 0], [0, 1]] }, expected_output: false },
    ],
    testCasesHidden: [
      { input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] }, expected_output: true },
      { input: { numCourses: 3, prerequisites: [[0, 1], [1, 2], [2, 0]] }, expected_output: false },
    ],
    hints: [
      { level: 1, text: "Model the tasks as vertices and dependencies as directed edges. The problem reduces to detecting a cycle in a directed graph." },
      { level: 2, text: "Apply Kahn's algorithm (indegree-based BFS) or use three-state DFS coloring (unvisited, in-progress, completed) to detect back edges." },
    ],
    isActive: true,
  },
  {
    title: "Elevation Chamber Water Retention",
    difficulty: "hard",
    topic: "arrays",
    description:
      "You are given an array of `n` non-negative integers representing a cross-section of terrain where each element is the height of a column with unit width.\n\nAfter a heavy rainfall, water collects in the valleys between columns. Compute the total volume of water retained between the columns.",
    optimalTimeComplexity: "O(n)",
    optimalSpaceComplexity: "O(1)",
    tags: ["arrays", "two-pointers", "stack", "monotonic-stack"],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "Water fills in the gaps between peaks. The total retained volume is 6 units.",
      },
    ],
    testCasesVisible: [
      { input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, expected_output: 6 },
      { input: { height: [4, 2, 0, 3, 2, 5] }, expected_output: 9 },
    ],
    testCasesHidden: [
      { input: { height: [3, 0, 2, 0, 4] }, expected_output: 7 },
      { input: { height: [5, 4, 1, 2] }, expected_output: 1 },
    ],
    hints: [
      { level: 1, text: "The water level at any index i is bounded by min(tallest_left, tallest_right) - height[i]." },
      { level: 2, text: "Use two pointers converging from opposite ends to compute the bounded water level in O(1) auxiliary space." },
    ],
    isActive: true,
  },
  {
    title: "Level-by-Level Tree Hierarchy Scanner",
    difficulty: "medium",
    topic: "trees",
    description:
      "Given the `root` of a binary tree, produce a level-order scan of all node values.\n\nReturn a nested array where each inner array contains the values of nodes at the same depth, ordered from left to right. The first inner array contains only the root value, the second contains values at depth 1, and so on.\n\nIf the tree is empty, return an empty array.",
    optimalTimeComplexity: "O(n)",
    optimalSpaceComplexity: "O(n)",
    tags: ["trees", "bfs", "queue", "breadth-first-search"],
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000",
    ],
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]",
        explanation: "Depth 0: [3], Depth 1: [9, 20], Depth 2: [15, 7].",
      },
      {
        input: "root = [1]",
        output: "[[1]]",
        explanation: "A single-node tree has one level containing one value.",
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "An empty tree returns an empty result.",
      },
    ],
    testCasesVisible: [
      {
        input: { root: [3, 9, 20, null, null, 15, 7] },
        expected_output: [[3], [9, 20], [15, 7]],
      },
      { input: { root: [1] }, expected_output: [[1]] },
      { input: { root: [] }, expected_output: [] },
    ],
    testCasesHidden: [
      {
        input: { root: [1, 2, 3, 4, 5] },
        expected_output: [[1], [2, 3], [4, 5]],
      },
      {
        input: { root: [0, -1, 1, -2, null, null, 2] },
        expected_output: [[0], [-1, 1], [-2, 2]],
      },
    ],
    hints: [
      {
        level: 1,
        text: "Use a queue (BFS). Begin by enqueuing the root. For each level, process all nodes currently in the queue before enqueuing their children.",
      },
      {
        level: 2,
        text: "Capture the queue size at the start of each iteration — that count tells you exactly how many nodes belong to the current depth level.",
      },
    ],
    isActive: true,
  },
  {
    title: "Concurrent Rate Limiter",
    difficulty: "hard",
    topic: "system-design",
    description:
      "Design and implement a thread-safe rate limiter class that allows at most `maxRequests` requests within any sliding window of `windowMs` milliseconds.\n\nImplement the `RateLimiter` class:\n- `RateLimiter(int maxRequests, int windowMs)` — Initializes the limiter.\n- `bool allow(int timestamp)` — Returns `true` if the request at the given `timestamp` (in milliseconds) should be allowed, `false` otherwise.\n\nThe implementation must be correct under concurrent access from multiple threads without data races.",
    optimalTimeComplexity: "O(1) amortized per allow() call",
    optimalSpaceComplexity: "O(maxRequests)",
    tags: [
      "system-design",
      "concurrency",
      "sliding-window",
      "queue",
      "rate-limiting",
      "thread-safety",
    ],
    constraints: [
      "1 <= maxRequests <= 10^4",
      "1 <= windowMs <= 10^9",
      "0 <= timestamp <= 10^18",
      "Timestamps across threads are not guaranteed to arrive in order.",
      "At most 10^6 allow() calls will be made across all threads.",
    ],
    examples: [
      {
        input:
          "RateLimiter(2, 1000)\nallow(100)  // true  (1 request in window)\nallow(200)  // true  (2 requests in window)\nallow(300)  // false (3rd request within 1000ms window)\nallow(1200) // true  (100ms request has expired)",
        output: "[true, true, false, true]",
        explanation:
          "Window [0, 1000): requests at 100 and 200 are allowed; 300 is denied. At 1200 the earliest request (100) falls outside [200, 1200), freeing a slot.",
      },
    ],
    testCasesVisible: [
      {
        input: {
          maxRequests: 2,
          windowMs: 1000,
          timestamps: [100, 200, 300, 1200],
        },
        expected_output: [true, true, false, true],
      },
      {
        input: {
          maxRequests: 1,
          windowMs: 500,
          timestamps: [0, 499, 500, 1000],
        },
        expected_output: [true, false, true, true],
      },
    ],
    testCasesHidden: [
      {
        input: {
          maxRequests: 3,
          windowMs: 2000,
          timestamps: [0, 500, 1000, 1500, 2001, 2500],
        },
        expected_output: [true, true, true, false, true, true],
      },
      {
        input: {
          maxRequests: 5,
          windowMs: 100,
          timestamps: [0, 10, 20, 30, 40, 50, 100, 110],
        },
        expected_output: [true, true, true, true, true, false, true, true],
      },
    ],
    hints: [
      {
        level: 1,
        text: "Model the window with a monotonic deque or a min-heap that tracks request timestamps. Evict entries older than (currentTimestamp - windowMs).",
      },
      {
        level: 2,
        text: "For thread safety, protect the queue with a mutex (or use a lock-free ring buffer). Prefer tryLock patterns to avoid blocking the hot path. Consider token-bucket or leaky-bucket variants for smoother enforcement.",
      },
    ],
    isActive: true,
  },
];

async function main() {
  console.log("Seeding DevMetric ProblemBank...");

  for (const p of INITIAL_PROBLEMS) {
    const existing = await prisma.problemBank.findFirst({
      where: { title: p.title },
    });

    if (!existing) {
      await prisma.problemBank.create({
        data: p,
      });
      console.log(`✓ Created problem: ${p.title} (${p.difficulty})`);
    } else {
      console.log(`- Problem already exists: ${p.title}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
