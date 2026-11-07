// Stack — Last-In First-Out (SF231 Lecture 6).
// "A stack is a special type of singly linked list where elements are inserted
//  and removed from only one end." We use the front (first) of the SList as the top.
//   push = addFirst      O(1)
//   pop  = removeFirst   O(1)
//   peek = first         O(1)
//
// Used in TU Alert for:
//   1. Screen history: opening a screen pushes it; the Back button pops it,
//      so Back always returns to the screen you saw just before (reversing the order).
//   2. Admin "Undo": every status change is pushed; Undo pops the latest change.

import { SList } from "./SList";

export class Stack<T> {
  private list = new SList<T>();

  push(item: T): void {
    this.list.addFirst(item);
  }

  pop(): T {
    if (this.list.isEmpty()) throw new Error("pop on empty stack");
    return this.list.removeFirst();
  }

  peek(): T | null {
    return this.list.first ? this.list.first.element : null;
  }

  size(): number {
    return this.list.size;
  }

  isEmpty(): boolean {
    return this.list.isEmpty();
  }
}
