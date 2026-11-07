// Sorting (SF231 Lecture 4) and recursion (Lecture 3).
//
// mergeSort — divide and conquer, recursive, O(n log n) in every case, and stable
//   (equal items keep their order). Used on the admin dashboard to sort all reports:
//   Safety hazard first, then newest first. Stable matters: two reports with the same
//   priority stay in time order.
//
// insertionSort — O(n) when the data are already in order, O(n^2) in reverse order.
//   Used for "My reports" on the phone: the list is already sorted, and a new report
//   arrives one at a time, so insertion sort only does a few comparisons.

export type Compare<T> = (a: T, b: T) => number; // < 0 means a comes first

export function mergeSort<T>(items: T[], compare: Compare<T>): T[] {
  // Base case: a list of 0 or 1 items is already sorted (stops the recursion)
  if (items.length <= 1) return items.slice();

  // Divide
  const mid = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, mid), compare); // recursive call
  const right = mergeSort(items.slice(mid), compare); // recursive call

  // Conquer: merge two sorted halves
  const merged: T[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) merged.push(left[i++]); // <= keeps it stable
    else merged.push(right[j++]);
  }
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);
  return merged;
}

export function insertionSort<T>(items: T[], compare: Compare<T>): T[] {
  const a = items.slice();
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; // first item of the unsorted group
    let j = i - 1;
    while (j >= 0 && compare(a[j], key) > 0) {
      a[j + 1] = a[j]; // shift bigger items to the right
      j--;
    }
    a[j + 1] = key; // insert into the sorted group
  }
  return a;
}

// --- How TU Alert compares reports -----------------------------------------

export type Report = {
  code: string; // e.g. "TU-8842"
  category: string; // "Safety hazard", "Electrical", ...
  createdAt: number; // time in milliseconds
  status: "submitted" | "acknowledged" | "in_progress" | "resolved";
};

const PRIORITY: Record<string, number> = { "Safety hazard": 0 }; // everything else = 1

export function byPriorityThenNewest(a: Report, b: Report): number {
  const pa = PRIORITY[a.category] ?? 1;
  const pb = PRIORITY[b.category] ?? 1;
  if (pa !== pb) return pa - pb; // safety hazards first
  return b.createdAt - a.createdAt; // then newest first
}

export function byNewest(a: Report, b: Report): number {
  return b.createdAt - a.createdAt;
}
