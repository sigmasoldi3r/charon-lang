/**
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

Charon index file script.
 */
function create(id) {
  const tag = document.getElementById(id);
  return CodeMirror.fromTextArea(tag, {
    mode: 'charon',
    theme: 'charon',
    lineWrapping: true,
  });
}

for (const elem of document.getElementsByClassName('editor-panel')) {
  CodeMirror.fromTextArea(elem, {
    mode: 'charon',
    theme: 'charon',
    lineWrapping: true,
  });
}

for (const elem of document.getElementsByTagName('issue')) {
  const id = elem.getAttribute('number');
  elem.innerHTML = `
    <p>
      <i>More documentation regarding the API is being added, check out the
        issue for details.</i>
      <a href="https://github.com/sigmasoldi3r/charon-lang/issues/${id}">
        <img src="https://img.shields.io/github/issues/detail/state/sigmasoldi3r/charon-lang/${id}?style=for-the-badge"
          alt="issue badge">
      </a>
    </p>`;
}
