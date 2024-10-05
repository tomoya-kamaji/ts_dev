// カリー化
namespace Carry {
  const preProc = (x: number): number => {
    return x++;
  };

  const x2 =
    (fn: (x: number) => number) =>
    (x: number): number => {
      return fn(x) * 2;
    };

  const x3 =
    (fn: (x: number) => number) =>
    (x: number): number => {
      return fn(x) * 3;
    };

  function main() {
    // 関数毎に初期化処理が必要
    const fx2 = x2(preProc);
    const fx3 = x3(preProc);

    console.log(fx2(1)); // -> 4
    console.log(fx2(2)); // -> 6
    console.log(fx3(1)); // -> 6
  }
}
