# TU Alert: how the code works (SF231 Data Structures and Algorithms)

TU Alert is a campus safety app for Thammasat. Students report broken or unsafe things with a photo and see the status. When there is a real emergency, the security office sends a verified alert to every phone.

This page explains how the app works, then shows where each SF231 topic is used in the code: linked list, queue, stack, hash map, sorting, recursion and Big-O. All data structure code is in `app/src/ds/` and is written the same way as in class.

---

## 1. How the app works

```
 Student iPhone (PWA)                Supabase (cloud)               Admin laptop (/admin)
 ┌───────────────────┐   save    ┌──────────────────────┐  live   ┌───────────────────────┐
 │ Report screen     │ ────────► │ reports table        │ ──────► │ Report QUEUE          │
 │ Alert screen      │ ◄──────── │ alerts table         │ ◄────── │ Send alert            │
 │ "I'm safe" button │ ────────► │ acks table           │ ──────► │ I'm safe HASH MAP     │
 └───────────────────┘   live    └──────────────────────┘         └───────────────────────┘
```

- **PWA (Progressive Web App).** The app is a website built with React and TypeScript. On iPhone you open the link in Safari and tap *Add to Home Screen*. It then gets an icon and opens full-screen like a normal app. Two files make this work:
  - a **manifest**, which gives the app's name, icon and colours;
  - a **service worker**, a small script that keeps a copy of the app on the phone so it opens fast.
- **Supabase** is the online database. It has three tables: `reports`, `alerts` and `acks` (who tapped "I'm safe").
- **Realtime.** When a row changes in the database, Supabase pushes the change to every open phone and laptop at once. That's why the student sees the status change the moment the admin clicks it.

**A report, step by step:**
1. The student fills in the photo, category and location, then taps Submit.
2. The report is put in the offline outbox, which is a **Queue**.
3. If the phone is online, the queue is emptied in order, so each report is saved to Supabase.
4. The admin laptop receives it live and adds it to the admin **Queue**. The list on screen is **merge sorted**: safety hazards first, then newest first.
5. The admin changes the status. Each change is also pushed on a **Stack**, so Undo works. Supabase pushes the new status to the student's phone.

**An alert, step by step:**
1. The admin sends a confirmed incident. Every phone receives it live and shows the red screen. The phone adds the alert to its history, which is an **SList**, with `addFirst` so the newest is on top.
2. A student taps "I'm safe". The laptop puts that phone's device id into a **HashMap**. A second tap from the same phone doesn't add a second entry, so each phone is counted once.

---

## 2. Singly linked list: `SList.ts` (Lecture 5)

**In class:** nodes linked in one direction, with meta data `first`, `last` and `size` kept for fast access.

**In TU Alert:** the alert history on the phone. A new alert goes to the front with `addFirst`, which is O(1). It is also the base of our Queue and Stack.

```ts
addFirst(element: T): void {
  const node = new Node(element);
  node.next = this.first;   // new node points to the old head
  this.first = node;        // new node becomes the head
  if (this.size === 0) this.last = node;
  this.size++;
}
```

**Why not an array?** Adding to the front of an array shifts every item, which is O(n). In the SList it is O(1).

| Operation | Big-O | Why |
|---|---|---|
| addFirst, addLast, removeFirst | O(1) | We keep `first` and `last` |
| removeLast, get(index) | O(n) | We must walk from the head |

---

## 3. Queue: `Queue.ts` (Lecture 6)

**In class:** First-In First-Out. "A queue has a linked list as a property." Enqueue = addLast, dequeue = removeFirst.

**In TU Alert:**
1. **The admin's report queue.** Reports are handled in the order students sent them, so nobody is skipped.
2. **The offline outbox on the phone.** No internet when you press Submit? The report waits in the queue and is sent in the same order when you're back online.
3. **The admin's "Needs help" list.** During an alert, whoever asked for help first is shown first. Each request is enqueued in the order it arrived, so the oldest stays at the front.

```ts
enqueue(item: T): void { this.list.addLast(item); }     // O(1)
dequeue(): T           { return this.list.removeFirst(); } // O(1)
```

Both are O(1) because the SList keeps `last`. Without it, enqueue would have to walk the whole list, which is O(n).

---

## 4. Stack: `Stack.ts` (Lecture 6)

**In class:** Last-In First-Out; push, pop and peek; used for reversing order.

**In TU Alert:**
1. **The Back button.** Opening a screen pushes it, and Back pops it. You always return to the screen you saw just before, which is the reversing-order application from class.
2. **Admin Undo.** Every status change is pushed, and Undo pops the latest one.

```ts
push(item: T): void { this.list.addFirst(item); }      // top = front of the SList, O(1)
pop(): T            { return this.list.removeFirst(); } // O(1)
```

We use the **front** of the SList as the top because both addFirst and removeFirst are O(1). If we used the back, pop would be removeLast, which is O(n).

---

## 5. Hash map: `HashMap.ts` (Lecture 4, Topic 5)

**In class:**
- Division hash function: `H(key) = key % hashSize`.
- The hash size is a prime number.
- Collisions are handled by separate chaining.
- The load factor is λ = size / hashSize, and the table is rehashed when it gets full.

**In TU Alert:**
1. **The "I'm safe" counter.** Key = the phone's device id. If the same student taps twice, the key is already there, so they're counted once.
2. **Finding a report by its ticket code** (for example `TU-8842`) on the admin dashboard.

```ts
hash(key: string): number {
  let k = 0;
  for (let i = 0; i < key.length; i++) k = (k * 31 + key.charCodeAt(i)) % 1_000_000_007;
  return k % this.hashSize;   // division hash function: H(key) = key % hashSize
}
```

- **Keys are strings, so first we turn them into a number.** Each character has a code number; we multiply and add them, then use the division method from class.
- **The hash size is 53**, a prime number, to reduce collisions.
- **Collisions use separate chaining.** Each address in the table holds an `SList`, so two keys with the same address both fit.
- **Load factor and rehash.** When λ goes above 0.9 (the class guideline for separate chaining), we **rehash** into a table about twice as big, using the next prime.

**Why a hash map?** To check "has this phone already tapped?" in an array, we'd scan every item, which is O(n). With hashing it's O(1) on average. During a fire with hundreds of students tapping at once, that matters.

---

## 6. Sorting: `sorting.ts` (Lecture 4) and recursion (Lecture 3)

### Merge sort: the admin report list
Reports are sorted **safety hazards first, then newest first**.

```ts
export function mergeSort<T>(items: T[], compare: Compare<T>): T[] {
  if (items.length <= 1) return items.slice();                  // base case: stops the recursion
  const mid = Math.floor(items.length / 2);
  const left  = mergeSort(items.slice(0, mid), compare);        // recursive call (divide)
  const right = mergeSort(items.slice(mid), compare);           // recursive call (divide)
  // ...merge the two sorted halves (conquer)
}
```

- **Recursion (Lecture 3):** merge sort calls itself on each half until it reaches the **base case** (0 or 1 item).
- **O(n log n) in every case.** The list is halved log₂ n times, and each level does at most n comparisons. Quick sort can drop to O(n²) with a bad pivot, and merge sort never does.
- **Stable.** We use `<=` when merging, so two reports with the same priority stay in time order.

### Insertion sort: "My reports" on the phone
The list is already sorted, and new reports arrive one at a time. Insertion sort on almost-sorted data is close to **O(n)**, which is its best case from class. Its worst case is O(n²), but a student's own report list is short.

---

## 7. Big-O summary

| Where in TU Alert | Structure | Main operation | Big-O |
|---|---|---|---|
| Alert history | SList | addFirst | O(1) |
| Report queue, offline outbox, Needs help list | Queue | enqueue, dequeue | O(1) |
| Back button, Undo | Stack | push, pop | O(1) |
| I'm safe count, find ticket | HashMap | put, get | O(1) average |
| Admin report list | Merge sort | sort | O(n log n) |
| My reports | Insertion sort | sort (almost sorted) | ≈ O(n) |

---

## 8. If the professor asks…

**"Why not just use JavaScript's built-in Array or Map?"**
In a real product we would; JavaScript's `Map` is a hash table too. We wrote our own so we could show and control the lecture ideas: division hash, chaining, load factor, and a queue built on a linked list.

**"How do you know it works?"**
Run `npx tsx src/ds/ds.test.ts` in the `app` folder. It checks each structure, including the exact sorting examples from the lecture slides (5 7 6 3 1 and 5 7 6 2 3 4 1 8).

**"What happens with many students?"**
- The hash map rehashes when λ > 0.9, so lookups stay O(1) on average.
- The queue never shifts items, so it stays O(1).
- Sorting is O(n log n), so 1,000 reports take about 10,000 comparisons, not 1,000,000.
