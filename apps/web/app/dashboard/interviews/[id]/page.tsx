"use client";

import { useState, useEffect } from "react";

export default function MockInterviewWorkspace() {
  const [isMuted, setIsMuted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Python 3.11");
  const [activeConsoleTab, setActiveConsoleTab] = useState<"tests" | "output" | "review">("tests");
  const [timerSeconds, setTimerSeconds] = useState(18 * 60 + 42); // 18:42

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#13131b]">
      <div className="flex flex-col w-full px-6 py-4 space-y-4 max-w-[1440px] mx-auto">

        {/* diagnostic bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1b1b23]/90 backdrop-blur-xl p-3 rounded-xl border border-[#46464f]/20 shadow-md">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#0d0d15] px-3 py-1 rounded-full border border-[#46464f]/25">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6bde80] animate-pulse shadow-[0_0_8px_rgba(107,222,128,0.8)]" />
              <span className="text-[10px] leading-[14px] font-[600] text-[#e4e1ed] uppercase tracking-wider">
                Session Active
              </span>
            </div>
            <div className="h-4 w-px bg-[#46464f]/40 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] leading-[24px] font-[500] text-[#e1dfff] font-semibold tracking-tight">
                Staff Systems &amp; Data Structures Round
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#292932] text-[#c0c1ff] font-mono text-[10px] leading-[14px] font-[600] border border-[#e1dfff]/20">
                Room #INT-9042
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#0d0d15]/90 px-3 py-1 rounded-lg border border-[#46464f]/30 shadow-sm">
              <span className="material-symbols-outlined text-[#918f9a] text-sm">timer</span>
              <span className="text-[16px] leading-[24px] font-mono text-[#e4e1ed] font-semibold">
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a]">/ 45:00</span>
            </div>

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="relative flex items-center gap-1.5 bg-[#292932] hover:bg-[#393841] px-3 py-1 rounded-lg text-[#e1dfff] text-[14px] leading-[22px] transition-all shadow-sm border border-[#e1dfff]/20 hover:border-[#e1dfff]/40 group"
            >
              <span className="material-symbols-outlined text-sm text-[#6bde80] group-hover:scale-110 transition-transform">
                insights
              </span>
              <span className="font-semibold text-xs">Diagnostic Debrief</span>
              <span className="px-1.5 py-0.5 bg-[#6bde80]/20 text-[#6bde80] text-[10px] font-mono rounded-full font-bold">
                91/100
              </span>
            </button>
          </div>
        </div>

        {/* main workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-start">

          {/* left column: problem & examiner */}
          <div className="lg:col-span-6 flex flex-col space-y-4">

            {/* ai examiner voice */}
            <div className="relative overflow-hidden bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-3 border border-[#46464f]/25 shadow-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c0c1ff] via-[#e1dfff] to-[#6bde80]" />
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#c0c1ff]/20 text-[#e1dfff] border border-[#e1dfff]/30 shadow-[0_0_16px_rgba(192,193,255,0.2)]">
                    <span className="material-symbols-outlined text-2xl">smart_toy</span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6bde80] ring-2 ring-[#13131b]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">DevMetric AI Examiner</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] text-[10px] leading-[14px] font-[600] border border-[#6bde80]/30">
                        Speaking
                      </span>
                    </div>
                    <span className="text-[12px] leading-[18px] text-[#918f9a]">L6 Staff Architecture Evaluator • Latency 18ms</span>
                  </div>
                </div>

                {/* audio waveform */}
                <div className="flex items-end gap-1 h-7 px-2 py-1 bg-[#0d0d15] rounded-md border border-[#46464f]/20">
                  <span className="w-1 bg-[#e1dfff] rounded-full animate-[pulse_1s_infinite] h-3" />
                  <span className="w-1 bg-[#e1dfff] rounded-full animate-[pulse_0.7s_infinite] h-6" />
                  <span className="w-1 bg-[#6bde80] rounded-full animate-[pulse_1.2s_infinite] h-4" />
                  <span className="w-1 bg-[#6bde80] rounded-full animate-[pulse_0.8s_infinite] h-7" />
                  <span className="w-1 bg-[#e1dfff] rounded-full animate-[pulse_1.4s_infinite] h-5" />
                  <span className="w-1 bg-[#e1dfff] rounded-full animate-[pulse_0.9s_infinite] h-3" />
                  <span className="w-1 bg-[#6bde80] rounded-full animate-[pulse_1.1s_infinite] h-6" />
                </div>
              </div>

              {/* live transcript */}
              <div className="bg-[#0d0d15]/90 rounded-lg p-3 space-y-1 border border-[#46464f]/20 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Live Examiner Feedback</span>
                  <span className="flex items-center gap-1 text-[10px] leading-[14px] font-[600] text-[#6bde80] font-mono">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6bde80] animate-ping" /> Realtime Transcript
                  </span>
                </div>
                <p className="text-[14px] leading-[22px] text-[#e4e1ed] leading-relaxed">
                  &quot;Your doubly linked list approach handles eviction in <span className="font-mono text-[#e1dfff] bg-[#1f1f27] px-1 py-0.5 rounded font-semibold text-xs">O(1)</span> time cleanly. Now, walk me through how you intend to synchronize node reordering when <span className="font-mono text-[#6bde80] bg-[#1f1f27] px-1 py-0.5 rounded font-semibold text-xs">get(key)</span> updates an existing item to Most Recently Used.&quot;
                </p>
              </div>
            </div>

            {/* problem statement */}
            <div className="bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-6 border border-[#46464f]/25 shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">LC 146: LRU Cache Implementation</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#ffb867]/20 text-[#ffddbb] text-[10px] leading-[14px] font-[600] border border-[#ffb867]/30">
                      Medium / Hard
                    </span>
                  </div>
                  <p className="text-[12px] leading-[18px] text-[#918f9a] mt-0.5">Category: Systems &amp; Concurrency Invariant Design</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] border border-[#46464f]/30">Hash Table</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] border border-[#46464f]/30">Doubly-Linked List</span>
                  <span className="px-2 py-0.5 rounded bg-[#292932] text-[#c7c5d0] text-[10px] leading-[14px] border border-[#46464f]/30">Design</span>
                </div>
              </div>

              {/* problem description */}
              <div className="space-y-2 text-[#c7c5d0] text-[14px] leading-[22px] leading-relaxed">
                <p>
                  Design a data structure that follows the constraints of a <strong className="text-[#e4e1ed] font-semibold">Least Recently Used (LRU) cache</strong>.
                </p>
                <p>
                  Implement the <code className="bg-[#0d0d15] px-1.5 py-0.5 rounded text-[#e1dfff] font-mono text-[12px] font-semibold">LRUCache</code> class:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[#e4e1ed]">
                  <li><code className="text-[#e1dfff] font-mono text-[12px]">LRUCache(int capacity)</code>: Initialize the cache with positive size <code className="text-[#e1dfff] font-mono text-[12px]">capacity</code>.</li>
                  <li><code className="text-[#e1dfff] font-mono text-[12px]">int get(int key)</code>: Return the value of the key if it exists, otherwise return <code className="text-[#ffb4ab] font-mono text-[12px]">-1</code>.</li>
                  <li><code className="text-[#e1dfff] font-mono text-[12px]">void put(int key, int value)</code>: Update or insert key-value pair. If capacity is exceeded, evict the least recently used key.</li>
                </ul>
                <div className="p-2 bg-[#c0c1ff]/10 rounded-lg text-[#e1dfff] flex items-start gap-2 border border-[#e1dfff]/20">
                  <span className="material-symbols-outlined text-base mt-0.5 text-[#e1dfff]">bolt</span>
                  <span className="text-[12px] leading-[18px] font-medium">Both <code className="font-mono font-bold">get</code> and <code className="font-mono font-bold">put</code> functions must run in <code className="font-mono font-bold">O(1)</code> average time complexity.</span>
                </div>
              </div>

              {/* examples & constraints */}
              <div className="space-y-2">
                <div className="bg-[#0d0d15]/90 rounded-lg p-3 space-y-1 border border-[#46464f]/20">
                  <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider font-semibold">Example 1</span>
                  <div className="font-mono text-[12px] text-[#e4e1ed] bg-[#292932]/50 p-2 rounded space-y-1 overflow-x-auto border border-[#46464f]/15">
                    <div><span className="text-[#918f9a]">Input:</span> [&quot;LRUCache&quot;, &quot;put&quot;, &quot;put&quot;, &quot;get&quot;, &quot;put&quot;, &quot;get&quot;, &quot;put&quot;, &quot;get&quot;, &quot;get&quot;, &quot;get&quot;]</div>
                    <div className="text-[#c7c5d0]">[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]</div>
                    <div className="pt-1"><span className="text-[#6bde80] font-semibold">Output:</span> [null, null, null, 1, null, -1, null, -1, 3, 4]</div>
                  </div>
                </div>

                <div className="bg-[#0d0d15]/90 rounded-lg p-3 space-y-1 border border-[#46464f]/20">
                  <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider font-semibold">Constraints</span>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[12px] text-[#c7c5d0]">
                    <div className="bg-[#1f1f27] p-1 rounded border border-[#46464f]/15 text-xs">1 &lt;= capacity &lt;= 3000</div>
                    <div className="bg-[#1f1f27] p-1 rounded border border-[#46464f]/15 text-xs">0 &lt;= key &lt;= 10^4</div>
                    <div className="bg-[#1f1f27] p-1 rounded border border-[#46464f]/15 text-xs">0 &lt;= value &lt;= 10^5</div>
                    <div className="bg-[#1f1f27] p-1 rounded border border-[#46464f]/15 text-xs">Up to 2 * 10^5 calls to get/put</div>
                  </div>
                </div>
              </div>

              {/* mic controls */}
              <div className="bg-[#0d0d15] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 border border-[#46464f]/25 shadow-md">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105 active:scale-95 ${
                      isMuted
                        ? "bg-[#34343d] text-[#ffb4ab]"
                        : "bg-[#e1dfff] text-[#131449] shadow-[0_0_20px_rgba(192,193,255,0.4)]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isMuted ? "mic_off" : "mic"}
                    </span>
                    {!isMuted && <span className="absolute inset-0 rounded-full bg-[#e1dfff]/30 animate-ping" />}
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">
                      {isMuted ? "Muted" : "Mic Active"}
                    </span>
                    <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a]">Press Space to mute / unmute</span>
                  </div>
                </div>

                {/* audio meter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] font-mono">VU</span>
                  <div className="flex gap-0.5 items-center bg-[#1f1f27] px-2 py-1.5 rounded border border-[#46464f]/20">
                    <div className="w-1.5 h-3 rounded-full bg-[#6bde80]" />
                    <div className="w-1.5 h-4 rounded-full bg-[#6bde80]" />
                    <div className="w-1.5 h-5 rounded-full bg-[#6bde80]" />
                    <div className="w-1.5 h-6 rounded-full bg-[#6bde80]" />
                    <div className="w-1.5 h-4 rounded-full bg-[#ffb867]" />
                    <div className="w-1.5 h-2 rounded-full bg-[#34343d]" />
                    <div className="w-1.5 h-2 rounded-full bg-[#34343d]" />
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1.5 rounded bg-[#292932] hover:bg-[#393841] text-[#ffdcba] text-[10px] leading-[14px] font-[600] transition-all shadow-sm border border-[#ffdcba]/20"
                  >
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span>Ask Hint</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* right column: editor & console */}
          <div className="lg:col-span-6 flex flex-col space-y-4">

            {/* code editor */}
            <div className="bg-[#1b1b23]/95 backdrop-blur-xl rounded-xl border border-[#46464f]/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
              {/* editor toolbar */}
              <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#0d0d15] border-b border-[#46464f]/20 gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* language selector */}
                  <div className="flex items-center gap-1 bg-[#1f1f27] px-2 py-1 rounded-lg border border-[#46464f]/25 shadow-inner">
                    <span className="material-symbols-outlined text-[#e1dfff] text-sm">code</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent text-[#e4e1ed] text-[12px] leading-[18px] outline-none cursor-pointer pr-1 font-mono font-medium"
                    >
                      <option className="bg-[#292932]" value="Python 3.11">Python 3.11</option>
                      <option className="bg-[#292932]" value="TypeScript 5.2">TypeScript 5.2</option>
                      <option className="bg-[#292932]" value="C++ (GCC 13)">C++ (GCC 13)</option>
                      <option className="bg-[#292932]" value="Java 21">Java 21</option>
                      <option className="bg-[#292932]" value="Go 1.22">Go 1.22</option>
                    </select>
                  </div>

                  {/* theme selector */}
                  <div className="flex items-center gap-1 text-[#918f9a] text-[10px] leading-[14px] font-[600]">
                    <span className="hidden sm:inline">Theme:</span>
                    <select className="bg-[#1f1f27] px-1.5 py-0.5 rounded text-[#e1dfff] font-mono text-[10px] border border-[#46464f]/20 outline-none cursor-pointer">
                      <option className="bg-[#292932]">Dark Obsidian</option>
                      <option className="bg-[#292932]">Monokai Cyber</option>
                      <option className="bg-[#292932]">Tokyo Night</option>
                    </select>
                  </div>

                  <div className="hidden md:flex items-center gap-1 text-[#918f9a] font-mono text-[10px]">
                    <span>14px</span>
                  </div>
                </div>

                {/* editor actions */}
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1f1f27] text-[#918f9a] hover:text-[#e4e1ed] transition-colors" title="Reset Boilerplate">
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span className="hidden sm:inline text-[10px] leading-[14px]">Reset</span>
                  </button>
                  <button className="p-1 rounded hover:bg-[#1f1f27] text-[#918f9a] hover:text-[#e4e1ed] transition-colors" title="Copy Code">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                  <button className="p-1 rounded hover:bg-[#1f1f27] text-[#918f9a] hover:text-[#e4e1ed] transition-colors" title="Format Code">
                    <span className="material-symbols-outlined text-sm">reorder</span>
                  </button>
                </div>
              </div>

              {/* editor body */}
              <div className="bg-[#0d0d15]/95 p-2 overflow-x-auto flex text-[#e4e1ed] font-mono text-[13px] leading-6 select-text min-h-[440px] border-b border-[#46464f]/20">
                {/* line numbers */}
                <div className="select-none text-right pr-3 text-[#46464f] font-mono space-y-0.5 opacity-60 border-r border-[#46464f]/20 min-w-[2.5rem]">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i + 1}>{i + 1}</div>
                  ))}
                </div>

                {/* highlighted code */}
                <div className="flex-1 space-y-0.5 pl-3 font-mono text-[13px] leading-relaxed">
                  <div className="text-[#918f9a] italic"># Double-ended node for O(1) removals and MRU head insertions</div>
                  <div><span className="text-[#e1dfff] font-semibold">class</span> <span className="text-[#ffdcba] font-bold">Node</span>:</div>
                  <div className="pl-4"><span className="text-[#e1dfff] font-semibold">def</span> <span className="text-[#6bde80] font-medium">__init__</span>(<span className="text-[#c0c1ff]">self</span>, key: <span className="text-[#6bde80]">int</span> = 0, val: <span className="text-[#6bde80]">int</span> = 0):</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.key = key</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.val = val</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.prev = <span className="text-[#918f9a]">None</span></div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.next = <span className="text-[#918f9a]">None</span></div>
                  <div className="h-1" />
                  <div><span className="text-[#e1dfff] font-semibold">class</span> <span className="text-[#6bde80] font-bold">LRUCache</span>:</div>
                  <div className="pl-4"><span className="text-[#e1dfff] font-semibold">def</span> <span className="text-[#6bde80] font-medium">__init__</span>(<span className="text-[#c0c1ff]">self</span>, capacity: <span className="text-[#6bde80]">int</span>):</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.capacity = capacity</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.cache = {}</div>
                  <div className="pl-8 text-[#918f9a] italic"># Sentinel Head (MRU) and Tail (LRU)</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.head, <span className="text-[#c0c1ff]">self</span>.tail = <span className="text-[#ffdcba]">Node</span>(), <span className="text-[#ffdcba]">Node</span>()</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.head.next = <span className="text-[#c0c1ff]">self</span>.tail</div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>.tail.prev = <span className="text-[#c0c1ff]">self</span>.head</div>
                  <div className="h-1" />
                  <div className="pl-4"><span className="text-[#e1dfff] font-semibold">def</span> <span className="text-[#6bde80] font-medium">get</span>(<span className="text-[#c0c1ff]">self</span>, key: <span className="text-[#6bde80]">int</span>) -&gt; <span className="text-[#6bde80]">int</span>:</div>
                  <div className="pl-8"><span className="text-[#e1dfff] font-semibold">if</span> key <span className="text-[#e1dfff] font-semibold">not in</span> <span className="text-[#c0c1ff]">self</span>.cache:</div>
                  <div className="pl-12"><span className="text-[#e1dfff] font-semibold">return</span> <span className="text-[#ffb4ab]">-1</span></div>
                  <div className="pl-8 bg-[#292932]/40 rounded-r px-1"><span className="text-[#c0c1ff]">self</span>._remove(<span className="text-[#c0c1ff]">self</span>.cache[key]) <span className="inline-block w-2 h-4 bg-[#e1dfff] align-middle ml-1 animate-pulse" /></div>
                  <div className="pl-8"><span className="text-[#c0c1ff]">self</span>._insert_head(<span className="text-[#c0c1ff]">self</span>.cache[key]) <span className="text-[#918f9a] italic"># Refresh to MRU</span></div>
                  <div className="pl-8"><span className="text-[#e1dfff] font-semibold">return</span> <span className="text-[#c0c1ff]">self</span>.cache[key].val</div>
                </div>
              </div>

              {/* console panel */}
              <div className="bg-[#1b1b23] p-3 space-y-2">
                {/* console tabs */}
                <div className="flex items-center justify-between border-b border-[#46464f]/20 pb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveConsoleTab("tests")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        activeConsoleTab === "tests"
                          ? "bg-[#292932] text-[#6bde80] border border-[#6bde80]/30 shadow-sm"
                          : "text-[#918f9a] hover:text-[#e4e1ed]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Test Cases (3/3 Passed)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveConsoleTab("output")}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        activeConsoleTab === "output"
                          ? "bg-[#292932] text-[#e1dfff]"
                          : "text-[#918f9a] hover:text-[#e4e1ed]"
                      }`}
                    >
                      Console Output
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveConsoleTab("review")}
                      className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                        activeConsoleTab === "review"
                          ? "bg-[#292932] text-[#e1dfff]"
                          : "text-[#918f9a] hover:text-[#e4e1ed]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs text-[#e1dfff]">auto_awesome</span>
                      <span>AI Review &amp; Complexity</span>
                    </button>
                  </div>
                  <span className="text-[10px] leading-[14px] text-[#6bde80] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6bde80]" /> Judge0 Ready (24ms)
                  </span>
                </div>

                {/* test cases */}
                {activeConsoleTab === "tests" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { name: "Case 1", ms: "2ms", sub: "cap: 2, put(1,1), put(2,2)", exp: "[1]", got: "[1]" },
                      { name: "Case 2 (Eviction)", ms: "3ms", sub: "cap: 2, put(3,3), get(2) == -1", exp: "[-1]", got: "[-1]" },
                      { name: "Case 3 (Stress)", ms: "11ms", sub: "1,000 randomized get/puts", exp: "42.8 MB", got: "Valid" },
                    ].map((tc) => (
                      <div key={tc.name} className="bg-[#0d0d15] p-2 rounded-lg space-y-1 border border-[#6bde80]/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#6bde80] text-sm">check_circle</span>
                            <span className="text-[10px] leading-[14px] text-[#e4e1ed] font-mono font-semibold">{tc.name}</span>
                          </div>
                          <span className="text-[#6bde80] text-[10px] font-semibold font-mono">{tc.ms}</span>
                        </div>
                        <p className="font-mono text-[11px] text-[#918f9a] truncate">{tc.sub}</p>
                        <div className="text-[10px] font-mono text-[#c7c5d0] flex items-center justify-between pt-0.5">
                          <span>Exp: {tc.exp}</span>
                          <span className="text-[#6bde80]">Got: {tc.got}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* bottom actions */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-[#918f9a] text-[10px] leading-[14px] font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#6bde80]" />
                      Memory: <strong className="text-[#e4e1ed]">42.8 MB</strong>
                    </span>
                    <span>•</span>
                    <span>Speed: <strong className="text-[#6bde80]">97.4% Percentile</strong></span>
                    <span>•</span>
                    <span>Complexity: <strong className="text-[#e1dfff] font-bold">O(1) / O(N)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 bg-[#292932] hover:bg-[#393841] px-3 py-1.5 rounded-lg text-[#e4e1ed] text-xs font-medium transition-all shadow-sm border border-[#46464f]/30"
                    >
                      <span className="material-symbols-outlined text-base text-[#e1dfff]">play_arrow</span>
                      <span>Run Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="flex items-center gap-1 bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-[0_0_16px_rgba(192,193,255,0.4)] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">task_alt</span>
                      <span>Submit Final Answer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* assessment summary */}
            <div className="bg-[#1b1b23]/90 backdrop-blur-xl rounded-xl p-3 border border-[#46464f]/25 shadow-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#6bde80]/15 text-[#6bde80] border border-[#6bde80]/30">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] leading-[22px] font-semibold text-[#e4e1ed]">Interview Diagnostic Ready</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#6bde80]/15 text-[#6bde80] font-mono font-bold">Strong Hire</span>
                  </div>
                  <span className="text-[12px] leading-[18px] text-[#918f9a]">Composite Score 91/100 • 4 Dimensions Analyzed</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#292932] hover:bg-[#393841] text-[#e1dfff] text-xs font-semibold transition-all border border-[#e1dfff]/20"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>Open Debrief Drawer</span>
              </button>
            </div>

          </div>
        </div>

        {/* debrief drawer */}
        {reportOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
            <div className="w-full sm:w-[480px] bg-[#1b1b23]/95 backdrop-blur-2xl border-l border-[#46464f]/30 shadow-[0_20px_48px_rgba(0,0,0,0.85)] flex flex-col justify-between h-full overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* drawer header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#46464f]/20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#c0c1ff]/20 text-[#e1dfff] border border-[#e1dfff]/30">
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[18px] leading-[26px] font-[600] text-[#e4e1ed]">Evaluation Report</h3>
                      <span className="text-[10px] leading-[14px] text-[#918f9a]">Realtime Model Inference • FAANG Standard</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="p-1 rounded-lg hover:bg-[#292932] text-[#918f9a] hover:text-[#e4e1ed]"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* score breakdown */}
                <div className="relative overflow-hidden bg-[#0d0d15] p-6 rounded-xl flex items-center justify-between shadow-md border border-[#46464f]/20">
                  <div className="space-y-1">
                    <span className="text-[10px] leading-[14px] font-[600] text-[#918f9a] uppercase tracking-wider">Composite Index</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[48px] leading-[56px] font-bold text-[#e1dfff]">91</span>
                      <span className="text-[16px] leading-[24px] text-[#918f9a] font-mono">/ 100</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#6bde80] text-[10px] leading-[14px] font-semibold">
                      <span className="material-symbols-outlined text-sm">trending_up</span> Strong Hire Probability (96%)
                    </div>
                  </div>

                  {/* progress ring */}
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-[#292932]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                      <path className="text-[#e1dfff]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="91, 100" strokeLinecap="round" strokeWidth="3.5" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[16px] leading-[24px] font-bold text-[#e4e1ed]">L6</span>
                      <span className="text-[10px] leading-[14px] text-[#918f9a] uppercase font-mono">Tier</span>
                    </div>
                  </div>
                </div>

                {/* skill scores */}
                <div className="space-y-4">
                  <span className="text-[16px] leading-[24px] font-[500] text-[#e4e1ed] font-semibold">Candidate Competencies</span>
                  {[
                    { label: "Technical Communication", icon: "record_voice_over", pct: "94%", color: "bg-[#e1dfff]", text: "text-[#e1dfff]" },
                    { label: "DSA & Data Invariants", icon: "memory", pct: "90%", color: "bg-[#6bde80]", text: "text-[#6bde80]" },
                    { label: "Code Quality & Modularity", icon: "code_blocks", pct: "88%", color: "bg-[#ffdcba]", text: "text-[#ffdcba]" },
                    { label: "Time & Space Optimization", icon: "speed", pct: "92%", color: "bg-[#c0c1ff]", text: "text-[#c0c1ff]" },
                  ].map((dim) => (
                    <div key={dim.label} className="space-y-1">
                      <div className="flex justify-between text-[12px] leading-[18px]">
                        <span className="text-[#e4e1ed] font-medium flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-sm ${dim.text}`}>{dim.icon}</span>
                          {dim.label}
                        </span>
                        <span className={`font-mono font-semibold ${dim.text}`}>{dim.pct}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#0d0d15] overflow-hidden">
                        <div className={`h-full ${dim.color} rounded-full`} style={{ width: dim.pct }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* evaluator feedback */}
                <div className="bg-[#1f1f27] p-4 rounded-xl space-y-2 border border-[#46464f]/20">
                  <div className="flex items-center gap-1.5 text-[#e1dfff] text-[14px] leading-[22px] font-semibold">
                    <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                    <span>Staff Evaluator Feedback</span>
                  </div>
                  <ul className="space-y-2 text-[#c7c5d0] text-[12px] leading-[18px] leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[#6bde80] text-base shrink-0 mt-0.5">check_circle</span>
                      <span>Exceptional boundary identification when handling empty cache evictions with zero dangling pointer references.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[#6bde80] text-base shrink-0 mt-0.5">check_circle</span>
                      <span>Articulated trade-offs between doubly linked list pointers vs. sequential array ring buffers proactively.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[#ffb867] text-base shrink-0 mt-0.5">info</span>
                      <span><strong className="text-[#e4e1ed]">Target Improvement:</strong> Emphasize thread-safety paradigms (e.g. Reader-Writer Mutex locks) if queried regarding multi-threaded web application backends.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* drawer actions */}
              <div className="p-6 bg-[#0d0d15]/90 border-t border-[#46464f]/20 flex items-center gap-3">
                <button
                  type="button"
                  className="flex-1 bg-[#c0c1ff] hover:bg-[#e1dfff] text-[#131449] py-2 rounded-lg font-semibold transition-all shadow-[0_0_16px_rgba(192,193,255,0.3)] text-center text-xs"
                >
                  Export Full Debrief PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#292932] text-[#c7c5d0] hover:text-[#e4e1ed] text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
