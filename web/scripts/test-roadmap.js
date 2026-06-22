const fs = require('fs');
const path = require('path');

function normalizeStatus(value) {
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '_');
  if (!['done', 'in_progress', 'blocked', 'not_started'].includes(normalized)) {
    throw new Error('Unsupported status value: ' + value);
  }
  return normalized;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || String(Math.random()).slice(2);
}

function parseTaskTable(markdown) {
  const match = markdown.match(/##\s+Task Status\s+([\s\S]*?)(?:\n##\s|$)/i);
  let tableSection = null;
  if (match) {
    tableSection = match[1];
  } else {
    // Fallback: find first table-like block
    const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('|')) continue;
      const cells = line.split('|').slice(1, -1).map(c => c.trim().toLowerCase());
      if (cells.length >= 2 && cells[0].includes('task') && cells[1].includes('status')) {
        headerIndex = i;
        break;
      }
    }
    if (headerIndex === -1) throw new Error('Missing Task Status section');
    const tableLines = [];
    for (let i = headerIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('|')) break;
      tableLines.push(line);
    }
    // parse rows
    const rows = tableLines
      .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
      .filter(cells => cells.length >= 2)
      .filter(cells => {
        const first = (cells[0] || '').toLowerCase();
        const second = (cells[1] || '').toLowerCase();
        return first !== 'task' && second !== 'status' && !/^[-:\s]+$/.test(cells.join(''));
      });

    return rows.map(([task, status, notes, content], index) => ({
      id: `task-${index + 1}-${slugify(task)}`,
      task,
      status: normalizeStatus(status),
      notes: notes || '',
      contentPath: content && content.length > 0 ? content : undefined,
    }));
  }

  const lines = tableSection
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|'));

  const rows = lines
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 3)
    .filter(cells => {
      const first = (cells[0] || '').toLowerCase();
      const second = (cells[1] || '').toLowerCase();
      return first !== 'task' && second !== 'status' && !/^[-:\s]+$/.test(cells.join(''));
    });

  return rows.map(([task, status, notes, content], index) => ({
    id: `task-${index + 1}-${slugify(task)}`,
    task,
    status: normalizeStatus(status),
    notes: notes || '',
    contentPath: content && content.length > 0 ? content : undefined,
  }));
}

(async function run(){
  try {
    const manifest = require('../src/lib/lanes.json');
    const entry = manifest.find(e => e.id === 'coachux');
    if (!entry) throw new Error("Manifest entry 'coachux' not found");

    const filePath = path.resolve(__dirname, '..', '..', entry.path);
    console.log('Reading instruction file:', filePath);
    const markdown = fs.readFileSync(filePath, 'utf-8');

    const tasks = parseTaskTable(markdown);
    console.log(`Parsed ${tasks.length} tasks for lane '${entry.label}'`);

    if (tasks.length === 0) {
      console.error('No tasks parsed — failing test');
      process.exit(1);
    }

    const expected = 'Map the full coach user journey.';
    const found = tasks.some(t => t.task && t.task.includes('Map the full coach user journey'));
    if (!found) {
      console.error('Expected task not found in parsed tasks');
      console.error('Parsed tasks:', tasks.map(t => t.task));
      process.exit(1);
    }

    console.log('Success: roadmap parsing produced tasks as expected');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

