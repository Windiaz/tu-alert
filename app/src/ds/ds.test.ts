// Run: npx tsx src/ds/ds.test.ts   (prints PASS lines, throws on failure)
import { SList, Queue, Stack, HashMap, mergeSort, insertionSort, byPriorityThenNewest, byNewest, Report } from "./index";

function check(name: string, ok: boolean) {
  if (!ok) throw new Error("FAIL: " + name);
  console.log("PASS:", name);
}

// SList
const list = new SList<number>();
list.addLast(7); list.addLast(4); list.addFirst(2);
check("SList order 2,7,4", list.toArray().join() === "2,7,4");
check("SList removeLast", list.removeLast() === 4 && list.last!.element === 7 && list.size === 2);
check("SList get", list.get(1) === 7);

// Queue: admin report queue is FIFO
const q = new Queue<string>();
q.enqueue("TU-1001"); q.enqueue("TU-1002"); q.enqueue("TU-1003");
check("Queue front/rear", q.queueFront() === "TU-1001" && q.queueRear() === "TU-1003");
check("Queue dequeue FIFO", q.dequeue() === "TU-1001" && q.dequeue() === "TU-1002" && q.size() === 1);

// Stack: Back button returns to the previous screen
const screens = new Stack<string>();
screens.push("Home"); screens.push("Report"); screens.push("Alerts");
check("Stack pop LIFO", screens.pop() === "Alerts" && screens.peek() === "Report");

// HashMap: "I'm safe" counted once per phone
const safe = new HashMap<number>(7);
safe.put("device-A", Date.now());
safe.put("device-B", Date.now());
safe.put("device-A", Date.now()); // same phone taps again
check("HashMap no double count", safe.size() === 2 && safe.has("device-A") && !safe.has("device-Z"));
for (let i = 0; i < 100; i++) safe.put("device-" + i, i);
check("HashMap rehash keeps data", safe.size() === 102 && safe.get("device-42") === 42 && safe.loadFactor() <= 0.9);
check("Division hash in range", (() => { const h = new HashMap<number>(53); const x = h.hash("TU-8842"); return x >= 0 && x < 53; })());

// Sorting
const nums = [5, 7, 6, 3, 1];
check("insertionSort lecture demo", insertionSort(nums, (a, b) => a - b).join() === "1,3,5,6,7");
check("mergeSort lecture demo", mergeSort([5, 7, 6, 2, 3, 4, 1, 8], (a, b) => a - b).join() === "1,2,3,4,5,6,7,8");

const reports: Report[] = [
  { code: "TU-1", category: "Electrical", createdAt: 100, status: "submitted" },
  { code: "TU-2", category: "Safety hazard", createdAt: 200, status: "submitted" },
  { code: "TU-3", category: "Plumbing", createdAt: 300, status: "submitted" },
  { code: "TU-4", category: "Safety hazard", createdAt: 400, status: "submitted" },
];
check("Admin sort: hazards first, newest first",
  mergeSort(reports, byPriorityThenNewest).map(r => r.code).join() === "TU-4,TU-2,TU-3,TU-1");
check("My reports sort newest first",
  insertionSort(reports, byNewest).map(r => r.code).join() === "TU-4,TU-3,TU-2,TU-1");

console.log("All data structure tests passed.");
