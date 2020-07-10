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
/**
 * Simple script to patch ico files for windows.
 */
const rcedit = require('rcedit');
const { join } = require('path');
const { statSync, readdirSync } = require('fs');
const { execSync } = require('child_process');

const home_dir = process.env.HOME || process.env.USERPROFILE;
const root = join(home_dir, '/.nexe');

try {
  const binaries = readdirSync(root);
  const target = binaries.filter(s => s.startsWith('windows-x64-')).sort()[0];
  if (target == null) {
    console.warn('No binaries found, running nexe...');
    console.log(execSync('yarn dist').toString())
    console.log(execSync('yarn patch-ico').toString())
  }
  console.log(`Patching shared binaries (${target})...`);
  rcedit(join(root, target), {
    icon: 'app.ico',
    'product-version': '0.4.0-rc.1'
  });
} catch(err) {
  console.warn('No nexe folder, running nexe...');
  console.log(execSync('yarn dist').toString())
  console.log(execSync('yarn patch-ico').toString())
}
