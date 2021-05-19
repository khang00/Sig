// function composition
Function.prototype["."] = function(g) {
  return (arg) => this(g(arg));
};

export const fst = <A, B>(a: A, _: B) => a;
export const snd = <A, B>(_: A, b: B) => b;

type Multiplex = <A, B, C>(fns: [(x: A) => C, (y: A) => B]) => (z: A) => [C, B]
export const multiplex: Multiplex = fns => arg => [fns[0](arg), fns[1](arg)];

type Tee = <A, B>(fn: (a: A) => B) => (arg: A) => A
export const tee: Tee = fn => arg => fst(arg, fn(arg));

type TakeSuccess = <Suc, Fail>(pair: [Suc, Fail]) => Suc
export const takeSuccess: TakeSuccess = pair => fst(...pair);

type TakeFailure = <Suc, Fail>(pair: [Suc, Fail]) => Fail
export const takeFail: TakeFailure = pair => snd(...pair);
