// 二分木の定義
type BinaryTree<T> =
  | { kind: "leaf"; value: T }
  | { kind: "node"; left: BinaryTree<T>; right: BinaryTree<T> };

// 使用例: 数値の二分木
const complexTree: BinaryTree<number> = {
  kind: "node", // ルート
  left: {
    kind: "node",
    left: { kind: "leaf", value: 5 },
    right: {
      kind: "node",
      left: { kind: "leaf", value: 3 },
      right: { kind: "leaf", value: 7 },
    },
  },
  right: {
    kind: "node",
    left: {
      kind: "node",
      left: { kind: "leaf", value: 9 },
      right: {
        kind: "node",
        left: { kind: "leaf", value: 4 },
        right: { kind: "leaf", value: 6 },
      },
    },
    right: { kind: "leaf", value: 2 },
  },
};

// 木の合計値を計算
function sumTree(tree: BinaryTree<number>): number {
  switch (tree.kind) {
    case "leaf":
      return tree.value;
    case "node":
      return sumTree(tree.left) + sumTree(tree.right);
  }
}

console.log(sumTree(complexTree));
