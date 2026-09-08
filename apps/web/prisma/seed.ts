import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INITIAL_PROBLEMS = [
  {
    title: "Two Sum",
    difficulty: "easy",
    topic: "arrays",
    description:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    optimalTimeComplexity: "O(n)",
    optimalSpaceComplexity: "O(n)",
    tags: ["arrays", "hash-table", "two-pointers"],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] == 6, we return [1, 2].",
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
      { level: 1, text: "Can you use a hash map to store elements you have already seen?" },
      { level: 2, text: "For each element x, check if (target - x) exists in your map." },
    ],
    isActive: true,
  },
  {
    title: "LRU Cache",
    difficulty: "medium",
    topic: "data-structures",
    description:
      "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class with `get(key)` and `put(key, value)` operations in O(1) average time complexity.",
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
          '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
        explanation: "Standard LRU cache eviction lifecycle when capacity is exceeded.",
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
      { level: 1, text: "Combine a hash map with a doubly linked list." },
      { level: 2, text: "The head holds the most recently used and the tail holds the least recently used." },
    ],
    isActive: true,
  },
  {
    title: "Coin Change",
    difficulty: "medium",
    topic: "dp",
    description:
      "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.",
    optimalTimeComplexity: "O(amount * coins.length)",
    optimalSpaceComplexity: "O(amount)",
    tags: ["dynamic-programming", "bfs"],
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
    examples: [
      {
        input: "coins = [1,2,5], amount = 11",
        output: "3",
        explanation: "11 = 5 + 5 + 1",
      },
      {
        input: "coins = [2], amount = 3",
        output: "-1",
        explanation: "The amount cannot be formed with the given coins.",
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
      { level: 1, text: "Think about bottom-up dynamic programming." },
      { level: 2, text: "Let dp[i] represent the minimum coins required for amount i. dp[i] = min(dp[i], dp[i - coin] + 1)." },
    ],
    isActive: true,
  },
  {
    title: "Course Schedule",
    difficulty: "medium",
    topic: "graphs",
    description:
      "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.",
    optimalTimeComplexity: "O(V + E)",
    optimalSpaceComplexity: "O(V + E)",
    tags: ["graphs", "dfs", "bfs", "topological-sort"],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "0 <= ai, bi < numCourses",
      "All pairs [ai, bi] are unique.",
    ],
    examples: [
      {
        input: "numCourses = 2, prerequisites = [[1,0]]",
        output: "true",
        explanation: "To take course 1 you must have finished course 0. So it is possible.",
      },
      {
        input: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        output: "false",
        explanation: "Cycle detected: 1 depends on 0 and 0 depends on 1.",
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
      { level: 1, text: "Can you model this as finding a cycle in a directed graph?" },
      { level: 2, text: "Use Kahn's algorithm (indegree BFS) or 3-state DFS (unvisited, visiting, visited)." },
    ],
    isActive: true,
  },
  {
    title: "Trapping Rain Water",
    difficulty: "hard",
    topic: "arrays",
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
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
        explanation: "The elevation map traps 6 units of rain water.",
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
      { level: 1, text: "Water trapped at index i is determined by min(max_left, max_right) - height[i]." },
      { level: 2, text: "Use two pointers from left and right inward to achieve O(1) auxiliary space." },
    ],
    isActive: true,
  },
  {
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    topic: "trees",
    description:
      "Given the `root` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
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
        explanation: "Level 0: [3], Level 1: [9, 20], Level 2: [15, 7].",
      },
      {
        input: "root = [1]",
        output: "[[1]]",
        explanation: "Single node — one level.",
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "Empty tree returns an empty array.",
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
        text: "Use a queue (BFS). Start with the root. For each level, drain all nodes currently in the queue before enqueuing the next level.",
      },
      {
        level: 2,
        text: "Snapshot the queue size at the beginning of each iteration — that tells you exactly how many nodes belong to the current level.",
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
