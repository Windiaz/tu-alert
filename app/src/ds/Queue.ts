// Queue — First-In First-Out (SF231 Lecture 6).
// Built exactly like in class: the queue has an SList as a property.
//   enqueue    = addLast of list      O(1)
//   dequeue    = removeFirst of list  O(1)
//   queueFront = first of list        O(1)
//   queueRear  = last of list         O(1)
//
// Used in TU Alert for:
//   1. The admin's report queue: reports are handled in the order students sent them.
//   2. The offline outbox on the phone: if there is no internet when a student presses
//      Submit, the report waits in a queue and is sent in the same order once online.

import { SList } from "./SList";

export class Queue<T> {
  private list = new SList<T>();

  enqueue(item: T): void {
    this.list.addLast(item);
  }

  dequeue(): T {
    if (this.list.isEmpty()) throw new Error("dequeue on empty queue");
    return this.list.removeFirst();
  }

  queueFront(): T | null {
    return this.list.first ? this.list.first.element : null;
  }

  queueRear(): T | null {
    return this.list.last ? this.list.last.element : null;
  }

  size(): number {
    return this.list.size;
  }

  isEmpty(): boolean {
    return this.list.isEmpty();
  }

  toArray(): T[] {
    return this.list.toArray();
  }
}
