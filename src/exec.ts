/*
MIT License

Copyright (c) 2020 Pablo Blanco Celdrán

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

type EntryReturn = number | void | Promise<void> | Promise<number>
type EntryFN = ((args: string[]) => EntryReturn) | (() => EntryReturn);
type EntryClass = {main:EntryFN};

function getMain(main: EntryFN | EntryClass): EntryFN {
  if (Object.getOwnPropertyDescriptor(main, 'main')?.value) {
    return (main as any).main as EntryFN;
  }
  return main as any as EntryFN;
}

// export function EntryPoint(target: EntryClass): void;
export function EntryPoint(target: EntryFN): void;
export function EntryPoint(target: EntryClass, name: string, field: PropertyDescriptor): void;
export function EntryPoint(target: EntryFN | EntryClass, name?: string, field?: PropertyDescriptor): void {
  const callTarget = getMain(target);
  process.nextTick(() => {
    const code = callTarget(process.argv);
    if (typeof(code) === 'number') {
      process.exit(code);
    } else if (code instanceof Promise) {
      (code as Promise<number | void>).then(result => {
        if (typeof(result) === 'number') {
          process.exit(result);
        } else {
          process.exit();
        }
      });
    } else {
      process.exit();
    }
  });
};
