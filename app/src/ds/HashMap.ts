// HashMap — hash table with the division hash function and separate chaining
// (SF231 Lecture 4, Topic 5).
//   hash function : H(key) = key % hashSize        (division method)
//   hashSize      : a prime number (53) to reduce collisions
//   collisions    : separate chaining — every address keeps an SList of entries
//   load factor   : λ = size / hashSize; when λ > 0.9 we rehash into a table about 2x bigger
//
// Our keys are strings (a ticket code like "TU-8842" or a phone's device id),
// so we first turn the string into a number by adding up its character codes
// with a multiplier. Then we apply the division hash function from class.
//
// Used in TU Alert for:
//   1. "I'm safe" counter: key = device id. If a student taps twice, the key already
//      exists, so we don't count them twice. Search is O(1) on average instead of
//      O(n) for scanning an array.
//   2. Finding a report by its ticket code on the admin dashboard.

import { SList } from "./SList";

type Entry<V> = { key: string; value: V };

export class HashMap<V> {
  private table: SList<Entry<V>>[];
  private hashSize: number;
  private count = 0;

  constructor(hashSize = 53) {
    this.hashSize = hashSize;
    this.table = HashMap.emptyTable<V>(hashSize);
  }

  private static emptyTable<V>(n: number): SList<Entry<V>>[] {
    const table: SList<Entry<V>>[] = [];
    for (let i = 0; i < n; i++) table.push(new SList<Entry<V>>());
    return table;
  }

  // String -> number, then the division hash function from class.
  hash(key: string): number {
    let k = 0;
    for (let i = 0; i < key.length; i++) {
      k = (k * 31 + key.charCodeAt(i)) % 1_000_000_007; // keep the number small
    }
    return k % this.hashSize; // H(key) = key % hashSize
  }

  loadFactor(): number {
    return this.count / this.hashSize;
  }

  put(key: string, value: V): void {
    const chain = this.table[this.hash(key)];
    let node = chain.first;
    while (node !== null) {
      if (node.element.key === key) {
        node.element.value = value; // key exists: update, don't add again
        return;
      }
      node = node.next;
    }
    chain.addLast({ key, value });
    this.count++;
    if (this.loadFactor() > 0.9) this.rehash();
  }

  get(key: string): V | undefined {
    let node = this.table[this.hash(key)].first;
    while (node !== null) {
      if (node.element.key === key) return node.element.value;
      node = node.next;
    }
    return undefined;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  size(): number {
    return this.count;
  }

  // Rehashing: move every entry into a bigger table with a new hash size.
  private rehash(): void {
    const old = this.table;
    this.hashSize = nextPrime(this.hashSize * 2);
    this.table = HashMap.emptyTable<V>(this.hashSize);
    this.count = 0;
    for (const chain of old) {
      let node = chain.first;
      while (node !== null) {
        this.put(node.element.key, node.element.value);
        node = node.next;
      }
    }
  }
}

function nextPrime(n: number): number {
  const isPrime = (x: number) => {
    if (x < 2) return false;
    for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
    return true;
  };
  while (!isPrime(n)) n++;
  return n;
}
