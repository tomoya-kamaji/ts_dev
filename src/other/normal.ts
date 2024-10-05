function preProc(x: number): number {
  return x++;
}

function x2(fn: (x: number) => number, x: number): number {
  return fn(x) * 2;
}

function main() {
  console.log(x2(preProc, 1)); // -> 4
  console.log(x2(preProc, 2)); // -> 6
}
