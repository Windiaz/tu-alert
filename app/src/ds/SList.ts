// SList — singly linked list (SF231 Lecture 5).
// Each Node keeps one element and a link to the next node.
// The list keeps meta data (first, last, size) for fast access, like in class.
//
// Used in TU Alert for:
//   - the alert history on the phone (newest alert added at the front with addFirst)
//   - the base of our Queue and Stack (Lecture 6: "a queue has a linked list as a property")

export class Node<T> {
  element: T;
  next: Node<T> | null = null;
  constructor(element: T) {
    this.element = element;
  }
}

export class SList<T> {
  first: Node<T> | null = null; // head
  last: Node<T> | null = null; // tail
  size = 0;

  isEmpty(): boolean {
    return this.size === 0;
  }

  // O(1): new node becomes the head
  addFirst(element: T): void {
    const node = new Node(element);
    node.next = this.first;
    this.first = node;
    if (this.size === 0) this.last = node;
    this.size++;
  }

  // O(1): thanks to the "last" meta data we don't walk the list
  addLast(element: T): void {
    const node = new Node(element);
    if (this.size === 0) {
      this.first = node;
    } else {
      this.last!.next = node;
    }
    this.last = node;
    this.size++;
  }

  // O(1)
  removeFirst(): T {
    if (this.first === null) throw new Error("removeFirst on empty list");
    const removed = this.first.element;
    this.first = this.first.next;
    this.size--;
    if (this.size === 0) this.last = null;
    return removed;
  }

  // O(n): in a singly linked list we must walk to the node before the last one
  removeLast(): T {
    if (this.last === null) throw new Error("removeLast on empty list");
    if (this.size === 1) return this.removeFirst();
    let current = this.first!;
    while (current.next !== this.last) current = current.next!;
    const removed = this.last.element;
    current.next = null;
    this.last = current;
    this.size--;
    return removed;
  }

  // O(n): walk from the head index steps
  get(index: number): T {
    if (index < 0 || index >= this.size) throw new Error("index out of range");
    let current = this.first!;
    for (let i = 0; i < index; i++) current = current.next!;
    return current.element;
  }

  // O(n): copy into an array so React can draw the list
  toArray(): T[] {
    const result: T[] = [];
    let current = this.first;
    while (current !== null) {
      result.push(current.element);
      current = current.next;
    }
    return result;
  }
}
