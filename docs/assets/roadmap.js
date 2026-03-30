import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const repoOwner = 'ciuc123';
const repoName = 'paas';
const repoBranch = 'main';
const lanesManifestPath = '.github/instructions/lanes.json';

const statusLabels = {
  done: 'Done',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  not_started: 'Not Started'
};

const statusClasses = {
  done: 'done',
  in_progress: 'in-progress',
  blocked: 'blocked',
  not_started: 'not-started'
};

function rawUrl(path) {
  return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${repoBranch}/${path}`;
}

function normalizeStatus(value) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  if (!statusLabels[normalized]) {
    throw new Error(`Unsupported status value: ${value}`);
  }
  return normalized;
}

function parseTaskTable(markdown) {
  const match = markdown.match(/## Task Status\s+([\s\S]*?)(?:\n##\s|$)/);
  if (!match) {
    throw new Error('Missing Task Status section');
  }

  const rows = match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));

  return rows
    .slice(2)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .map(([task, status, notes, content]) => ({
      task,
      status: normalizeStatus(status),
      notes,
      ...(content && content.length > 0 ? { contentPath: content } : {})
    }));
}

function aggregateStatus(tasks) {
  const statuses = new Set(tasks.map((task) => task.status));
  if (statuses.has('blocked')) {
    return 'blocked';
  }
  if (statuses.size === 1 && statuses.has('done')) {
    return 'done';
  }
  if (statuses.has('in_progress')) {
    return 'in_progress';
  }
  if (statuses.size === 1 && statuses.has('not_started')) {
    return 'not_started';
  }
  return 'in_progress';
}

function buildMermaid(lanes) {
  const lines = [
    'flowchart LR',
    'classDef done fill:#d1fae5,stroke:#047857,color:#064e3b,stroke-width:2px;',
    'classDef in_progress fill:#fef3c7,stroke:#b45309,color:#78350f,stroke-width:2px;',
    'classDef blocked fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,stroke-width:2px;',
    'classDef not_started fill:#e5e7eb,stroke:#4b5563,color:#111827,stroke-width:2px;'
  ];

  lanes.forEach((lane) => {
    const counts = {
      done: 0,
      in_progress: 0,
      blocked: 0,
      not_started: 0
    };

    lane.tasks.forEach((task) => {
      counts[task.status] += 1;
    });

    const label = `${lane.label}\\n${statusLabels[lane.aggregateStatus]}\\n${counts.done} done / ${counts.in_progress} in progress / ${counts.blocked} blocked / ${counts.not_started} not started`;
    lines.push(`${lane.id}["${label}"]:::${lane.aggregateStatus}`);
  });

  for (let index = 0; index < lanes.length - 1; index += 1) {
    lines.push(`${lanes[index].id} --> ${lanes[index + 1].id}`);
  }

  return lines.join('\n');
}

function renderSnapshot(lanes, textId, listId) {
  const list = document.getElementById(listId);
  const text = document.getElementById(textId);
  list.innerHTML = '';

  const totalTasks = lanes.reduce((sum, lane) => sum + lane.tasks.length, 0);
  const blockedLanes = lanes.filter((lane) => lane.aggregateStatus === 'blocked').length;
  text.textContent = `Live summary from ${lanes.length} instruction files and ${totalTasks} tracked tasks on the main branch. ${blockedLanes ? `${blockedLanes} lane${blockedLanes > 1 ? 's are' : ' is'} blocked.` : 'No lanes are blocked right now.'}`;

  lanes.forEach((lane) => {
    const item = document.createElement('li');
    item.textContent = `${lane.label}: ${statusLabels[lane.aggregateStatus]}`;
    list.appendChild(item);
  });
}

function renderLaneStrip(lanes, stripId) {
  const container = document.getElementById(stripId);
  container.innerHTML = '';

  lanes.forEach((lane) => {
    const counts = lane.tasks.reduce((accumulator, task) => {
      accumulator[task.status] += 1;
      return accumulator;
    }, { done: 0, in_progress: 0, blocked: 0, not_started: 0 });

    const card = document.createElement('article');
    card.className = 'panel lane-panel';
    const tasksHtml = lane.tasks.map((task) => `
      <article class="task-row">
        <div class="task-row-top">
          <h3 class="task-title">${task.task}</h3>
          <span class="badge ${statusClasses[task.status]}">${statusLabels[task.status]}</span>
        </div>
        <p class="task-notes">${task.notes}</p>
        ${task.contentPath ? `
        <div class="task-content-actions">
          <a
            href="${rawUrl(task.contentPath)}"
            target="_blank"
            rel="noopener noreferrer"
            class="task-content-link"
          >
            <svg class="task-content-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            View output
          </a>
          ${task.contentPath.endsWith('.md') ? `
          <a
            href="content/?path=${encodeURIComponent(task.contentPath)}"
            class="task-content-link"
          >
            <svg class="task-content-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Read content
          </a>` : ''}
        </div>` : ''}
      </article>
    `).join('');

    card.innerHTML = `
      <header class="panel-header">
        <div>
          <p class="eyebrow">Instruction lane</p>
          <h2>${lane.label}</h2>
          <p class="panel-copy">${lane.tasks.length} tasks tracked from ${lane.path}.</p>
        </div>
        <span class="badge ${statusClasses[lane.aggregateStatus]}">${statusLabels[lane.aggregateStatus]}</span>
      </header>
      <p class="lane-meta">${counts.done} done, ${counts.in_progress} in progress, ${counts.blocked} blocked, ${counts.not_started} not started</p>
      <div class="task-list">${tasksHtml}</div>
    `;

    container.appendChild(card);
  });
}

async function renderDiagram(markup, diagramId) {
  const container = document.getElementById(diagramId);
  const element = document.createElement('pre');
  element.className = 'mermaid';
  element.textContent = markup;
  container.innerHTML = '';
  container.appendChild(element);
  await mermaid.run({ nodes: [element] });
}

function setRefreshChip(refreshChipId, message) {
  const chip = document.getElementById(refreshChipId);
  if (chip) {
    chip.textContent = message;
  }
}

async function loadLanesManifest() {
  const response = await fetch(rawUrl(lanesManifestPath), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load lanes manifest: ${lanesManifestPath}`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`Invalid JSON in lanes manifest: ${lanesManifestPath}`);
  }
}

async function loadStatuses() {
  const manifest = await loadLanesManifest();
  return Promise.all(manifest.map(async (entry) => {
    const response = await fetch(rawUrl(entry.path), { cache: 'no-store' });
    if (!response.ok) {
      const tasks = entry.defaultTasks ?? [];
      return {
        id: entry.id,
        label: entry.label,
        path: entry.path,
        tasks,
        aggregateStatus: aggregateStatus(tasks)
      };
    }
    const markdown = await response.text();
    const tasks = parseTaskTable(markdown);
    return {
      id: entry.id,
      label: entry.label,
      path: entry.path,
      tasks,
      aggregateStatus: aggregateStatus(tasks)
    };
  }));
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    background: '#fffdf8',
    primaryColor: '#fffdf8',
    primaryTextColor: '#1d1a17',
    primaryBorderColor: '#b89c78',
    lineColor: '#8b7357',
    fontFamily: 'Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif'
  },
  flowchart: {
    curve: 'basis',
    useMaxWidth: false,
    htmlLabels: true
  }
});

export async function loadRoadmap(options) {
  const {
    diagramId,
    snapshotTextId,
    snapshotListId,
    laneStripId,
    loadingId,
    errorId,
    refreshChipId
  } = options;

  const loadingState = document.getElementById(loadingId);
  const errorState = document.getElementById(errorId);
  loadingState.hidden = false;
  errorState.hidden = true;

  try {
    const lanes = await loadStatuses();
    await renderDiagram(buildMermaid(lanes), diagramId);
    renderSnapshot(lanes, snapshotTextId, snapshotListId);
    renderLaneStrip(lanes, laneStripId);
    loadingState.hidden = true;
    setRefreshChip(refreshChipId, `Live from ${repoBranch} branch`);
  } catch (error) {
    loadingState.hidden = true;
    errorState.hidden = false;
    errorState.textContent = `Could not load live task status from .github/instructions: ${error.message}`;
    setRefreshChip(refreshChipId, 'Live status unavailable');
    console.error(error);
  }
}