import * as chai from 'chai';
import Match, { EqualityChecker } from '../src/Matcher';

const {expect, assert} = chai;

describe('Matcher', () => {
  it('one case', () => {
    expect(
      Match(1)
        .case(1, () => 0)
        .exec()
    ).to.eq(0);
  });

  it('multiple cases', () => {
    expect(
      Match(2)
        .case(1, () => true)
        .case(2, () => false)
        .exec()
    ).to.eq(false);
  });

  it('basic types', () => {
    expect(
      Match(3)
        .case(2, () => 99)
        .case(3, () => 44)
        .exec()
    ).to.eq(44);
    expect(
      Match('magic')
        .case('magic', () => 99)
        .case('science', () => 44)
        .exec()
    ).to.eq(99);
    expect(
      Match([1, 2])
        .case([1, 3], () => 99)
        .case([], () => 77)
        .case([1, 2], () => 44)
        .exec()
    ).to.eq(44);
  });

  it('input is being passed to handler', () => {
    expect(
      Match(4)
        .case(4, x => x * x * x)
        .exec()
    ).to.eq(64);
  });

  it('runs only the first match (short circuit)', () => {
    let ran = false;
    expect(
      Match(true)
        .case(true, () => 0)
        .case(true, () => {
          ran = true;
          return 1;
        })
        .exec()
    ).to.be.eq(0);
    expect(ran).to.be.false; // tslint:disable-line
  });

  it('uses deep equality', () => {
    interface AB {a: { b: number }}

    const obj: AB = {a: {b: 5}};
    expect(
      Match(obj)
        .case({a: {b: 4}}, () => 'a')
        .case({a: {b: 5}}, () => 'b')
        .exec()
    ).to.eq('b');
  });

  it('works nice with interfaces and classes', () => {
    class C {constructor(public a: number, public b: string) { }}

    const x = new C(1, 'f');
    const y = new C(2, 'b');
    expect(
      Match(new C(2, 'b'))
        .case(x, () => 1)
        .case(y, () => 2)
        .exec()
    ).to.eq(2);
  });

  it('crashes on no match', () => {
    assert.throws(() => {
      Match(2).case(0, () => {}).case(1, () => {}).exec();
    });
  });

  it('guarded case', () => {
    expect(
      Match('x').caseGuarded(() => true, x => x + x).exec()
    ).to.eq('xx');
    expect(
      Match(-5)
        .caseGuarded(x => x < 0, () => 'less')
        .case(0, () => 'zero')
        .caseGuarded(x => x > 0, () => 'more')
        .exec()
    ).to.eq('less');
  });

  it('default works as expected', () => {
    expect(
      Match(2)
        .case(0, () => 0)
        .case(1, () => 1)
        .default(() => 9)
        .exec()
    ).to.eq(9);
  });

  it('supports multiple values to compare to', () => {
    expect(
      Match(2)
        .caseMulti([0, 1], () => 0)
        .caseMulti([2, 3], () => 1)
        .caseMulti([4, 5], () => 2)
        .exec()
    ).to.be.eq(1);
    expect(
      Match('a')
        .caseMulti([], () => 0)
        .caseMulti(['b', 'c', 'd'], () => 1)
        .caseMulti(['a'], () => 2)
        .exec()
    ).to.be.eq(2);
    expect(
      Match({a: 2})
        .caseMulti([{a: 0}, {a: 1}], () => 0)
        .caseMulti([{a: 2}, {a: 3}], () => 1)
        .caseMulti([{a: 4}, {a: 5}], () => 2)
        .exec()
    ).to.be.eq(1);
  });

  it('maps over result', () => {
    expect(
      Match(1)
        .case(0, () => 'bb')
        .default(() => 'ccc')
        .execMap(x => x.length)
    ).to.be.eq(3);
  });

  it('calc example', () => {
    type Operation = '+' | '-' | '*' | '/';

    interface Computation {
      a: number;
      b: number;
      op: Operation;
      result: number;
    }

    const compute = (a: number, b: number, op: Operation): Computation =>
      Match(op)
        .case('+', () => a + b)
        .case('-', () => a - b)
        .case('*', () => a * b)
        .case('/', () => a / b)
        // .case('x', () => 0)
        // .case('/', () => '')
        .execMap(result => ({a, b, op, result}));

    const computeSwitch = (a: number, b: number, op: Operation): Computation => {
      let result;
      switch (op) {
        case '+':
          result = a + b;
          break;
        case '-':
          result = a - b;
          break;
        case '*':
          result = a * b;
          break;
        case '/':
          result = a / b;
          break;
      }
      return {a, b, op, result: <number>result};
    };
    expect(compute(1, 2, '+')).to.eql({a: 1, b: 2, op: '+', result: 3});
    expect(computeSwitch(1, 2, '+')).to.eql({a: 1, b: 2, op: '+', result: 3});
  });

  it('animal example', () => {
    const oldLog = console.log; // tslint:disable-line no-console
    const logCalls: any[] = [];
    console.log = (...args) => logCalls.push(args); // tslint:disable-line no-console

    const animal = 'dog';
    Match(animal)
      .case('spider', () => `I don't like those.`)
      .case('dog', () => 'What a good boy!')
      .execMap(x => console.log(x)); // tslint:disable-line no-console

    console.log = oldLog; // tslint:disable-line no-console
    expect(logCalls).to.be.eql([['What a good boy!']]);
  });

  it('uses custom equality checker', () => {
    EqualityChecker.initialize(() => true);
    expect(
      Match(0)
        .case(1, () => '0=1')
        .exec()
    ).to.be.eq('0=1');
    EqualityChecker.initialize();
  });
});
