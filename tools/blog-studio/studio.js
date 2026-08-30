const query = new URLSearchParams(location.search);
const token = query.get('token') ?? '';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const output = $('[data-output]');
const running = $('[data-running]');
const editor = $('[data-editor]');
const preview = $('[data-preview]');
let currentPath = '';
let savedContent = '';

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', 'X-Blog-Studio-Token': token, ...(options.headers ?? {}) } });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? value.output ?? `HTTP ${response.status}`);
  return value;
}

function writeOutput(value, state = 'DONE') {
  output.textContent = value;
  running.textContent = state;
}

function escapeHtml(value) { return value.replace(/[&<>"']/gu, (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[item]); }
function markdown(value) {
  const source = value.replace(/^---[\s\S]*?---\s*/u, '');
  return escapeHtml(source)
    .replace(/^### (.+)$/gmu, '<h3>$1</h3>').replace(/^## (.+)$/gmu, '<h2>$1</h2>').replace(/^# (.+)$/gmu, '<h1>$1</h1>')
    .replace(/^> (.+)$/gmu, '<blockquote>$1</blockquote>').replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/gu, '<a href="$2">$1</a>')
    .split(/\n{2,}/u).map((block) => /^<(?:h|blockquote|ul|ol)/u.test(block) ? block : `<p>${block.replaceAll('\n', '<br>')}</p>`).join('');
}

function refreshEditorState() {
  preview.innerHTML = markdown(editor.value);
  $('[data-line-count]').textContent = `${editor.value.split('\n').length} LINES`;
  const dirty = editor.value !== savedContent;
  $('[data-file-state]').textContent = dirty ? 'UNSAVED' : 'CLEAN';
  $('[data-save]').disabled = !currentPath || !dirty;
  if (currentPath) $('[data-tab-name] span').textContent = dirty ? '●' : '○';
}

async function loadTree() {
  const tree = $('[data-tree]');
  try {
    const { files } = await request('/api/tree');
    tree.replaceChildren();
    for (const collection of ['posts', 'columns', 'notes']) {
      const heading = document.createElement('h2'); heading.textContent = { posts: 'ARTICLES', columns: 'THEMES', notes: 'LEARNING NOTES' }[collection]; tree.append(heading);
      for (const path of files.filter((file) => file.startsWith(`src/content/${collection}/`))) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.path = path;
        const icon = document.createElement('i'); icon.textContent = collection === 'posts' ? 'A' : collection === 'columns' ? 'T' : 'N';
        const label = document.createElement('span'); label.textContent = path.split('/').at(-2) ?? path;
        button.append(icon, label);
        button.addEventListener('click', () => openFile(path)); tree.append(button);
      }
    }
  } catch (error) { const message = document.createElement('p'); message.textContent = error.message; tree.replaceChildren(message); }
}

async function openFile(path) {
  if (editor.value !== savedContent && !confirm('当前文件尚未保存，仍要切换吗？')) return;
  try {
    const file = await request(`/api/file?path=${encodeURIComponent(path)}`);
    currentPath = file.path; savedContent = file.content; editor.value = file.content;
    $('[data-welcome]').hidden = true; $('[data-editor-shell]').hidden = false;
    $('[data-tab-name]').lastChild.textContent = ` ${path.split('/').at(-2)}.${path.endsWith('.mdx') ? 'mdx' : 'md'}`;
    $('[data-current]').textContent = path; $$('[data-tree] button').forEach((button) => button.classList.toggle('active', button.dataset.path === path)); refreshEditorState();
  } catch (error) { writeOutput(error.message, 'ERROR'); }
}

async function save() {
  if (!currentPath) return;
  try { await request('/api/file', { method: 'PUT', body: JSON.stringify({ path: currentPath, content: editor.value }) }); savedContent = editor.value; refreshEditorState(); writeOutput(`已原子保存 ${currentPath}`); }
  catch (error) { writeOutput(error.message, 'ERROR'); }
}

async function runCommand(command) {
  running.textContent = `RUNNING / ${command.toUpperCase()}`; output.textContent = `正在运行 ${command}…`;
  try { const result = await request('/api/run', { method: 'POST', body: JSON.stringify({ command }) }); writeOutput(result.output || `${command} 完成`); }
  catch (error) { writeOutput(error.message, 'FAILED'); }
}

$$('[data-panel]').forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.panel; $$('.activity button').forEach((item) => item.classList.toggle('active', item.dataset.panel === name));
  $$('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== name; });
}));
$$('[data-command]').forEach((button) => button.addEventListener('click', () => runCommand(button.dataset.command)));
$('[data-refresh]').addEventListener('click', loadTree); $('[data-save]').addEventListener('click', save); editor.addEventListener('input', refreshEditorState);
document.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); } });

const dialog = $('[data-create-dialog]');
$('[data-create]').addEventListener('click', () => dialog.showModal());
dialog.addEventListener('close', async () => {
  if (dialog.returnValue !== 'create') return;
  const form = new FormData(dialog.querySelector('form'));
  try { const result = await request('/api/create', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) }); await loadTree(); await openFile(result.path); writeOutput(`已建立草稿 ${result.path}`); }
  catch (error) { writeOutput(error.message, 'ERROR'); }
});
$('[data-sync]').addEventListener('click', async () => {
  const source = $('[data-note-source]').value.trim(); running.textContent = 'SYNCING NOTES';
  try { const result = await request('/api/notes/sync', { method: 'POST', body: JSON.stringify({ source, dryRun: $('[data-dry-run]').checked }) }); writeOutput(result.output); await loadTree(); }
  catch (error) { writeOutput(error.message, 'FAILED'); }
});

addEventListener('beforeunload', (event) => { if (editor.value !== savedContent) event.preventDefault(); });
loadTree();
