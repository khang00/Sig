export class Tree<A> {
  node: Node<A>;
  trees: Array<Tree<A>>;

  constructor(node: Node<A>) {
    this.node = node;
    this.trees = [];
  }
}

export class Node<A> {
  item: A;

  constructor(item: A) {
    this.item = item;
  }
}
