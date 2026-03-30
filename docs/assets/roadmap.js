import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const repoOwner = 'ciuc123';
const repoName = 'paas';
const repoBranch = 'main';
const instructionFiles = [
  { id: 'research', label: 'Research & Product', path: '.github/instructions/01-product-research.instructions.md' },
  { id: 'architecture', label: 'Framework & Architecture', path: '.github/instructions/02-product-architecture.instructions.md' },
  { id: 'coachux', label: 'Coach UX & Questionnaire', path: '.github/instructions/03-coach-ux.instructions.md' },
  { id: 'questionnaire', label: 'Questionnaire & Rules', path: '.github/instructions/04-questionnaire-wizard.instructions.md' },
  { id: 'backend', label: 'Backend & Infrastructure', path: '.github/instructions/05-backend-infrastructure.instructions.md' },
  { id: 'frontend', label: 'Frontend & UI', path: '.github/instructions/06-frontend-ui.instructions.md' },
  { id: 'ai', label: 'AI & Content', path: '.github/instructions/07-ai-content.instructions.md' },
  { id: 'security', label: 'Security & Privacy', path: '.github/instructions/08-security-privacy.instructions.md' },
  { id: 'billing', label: 'Monetization & Billing', path: '.github/instructions/09-monetization-billing.instructions.md' },
  { id: 'analytics', label: 'Analytics & Feedback', path: '.github/instructions/10-analytics-feedback.instructions.md' },
  { id: 'pilot', label: 'Pilot & Iteration', path: '.github/instructions/11-pilot-iterations.instructions.md' },
  { id: 'gtm', label: 'Go-To-Market', path: '.github/instructions/12-go-to-market.instructions.md' }
];

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
    const tasksHtml = lane.tasks.map((task) => {
      const downloadLink = task.contentPath ? `
        <a class="task-content-link" href="${rawUrl(task.contentPath)}" target="_blank" rel="noopener noreferrer" aria-label="Download generated content">
          <svg class="task-content-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>` : '';
      return `
      <article class="task-row">
        <div class="task-row-top">
          <h3 class="task-title">${task.task}</h3>
          <span class="badge ${statusClasses[task.status]}">${statusLabels[task.status]}</span>
        </div>
        <p class="task-notes">${task.notes}</p>
        ${downloadLink}
      </article>`;
    }).join('');

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

async function loadStatuses() {
  return Promise.all(instructionFiles.map(async (file) => {
    const response = await fetch(rawUrl(file.path), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${file.path}: ${response.status}`);
    }
    const markdown = await response.text();
    const tasks = parseTaskTable(markdown);
    return {
      ...file,
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