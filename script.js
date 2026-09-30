'use strict';
const grid = document.querySelector('#demo-grid');
const portraitGrid = document.querySelector('#portrait-grid');
const player = document.querySelector('#demo-player');
const playerVideo = document.querySelector('#player-video');
const playerError = document.querySelector('#player-error');
let gallery = [];
let activeGallery = [];
let currentClip = 0;
let playbackRequest = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let datasetMotionEnabled = !reducedMotion.matches;
const visibleDatasetVideos = new Set();
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = () => window.lucide?.createIcons();
const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

async function getData(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  return response.json();
}

function renderDemos(demos) {
  gallery = [...demos.filter(d => d.orientation !== 'portrait'), ...demos.filter(d => d.orientation === 'portrait')];
  const cards = gallery.map((d, i) => `<figure class="demo-card" data-id="${d.id}">
    <button class="demo-preview" type="button" data-clip="${i}" aria-label="Play ${escapeHtml(d.title)}" title="Play ${escapeHtml(d.title)}">
      <img src="${d.poster}" alt="${escapeHtml(d.title)}" loading="${i < 6 ? 'eager' : 'lazy'}">
      <span class="play-icon"><i data-lucide="play" aria-hidden="true"></i></span>
      <span class="clip-duration">${duration(d.duration)}</span>
    </button>
    <figcaption class="demo-caption"><span class="demo-number">${String(i + 1).padStart(2,'0')}</span><div><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.setup)}</p></div></figcaption>
  </figure>`);
  grid.innerHTML = cards.filter((_, i) => gallery[i].orientation !== 'portrait').join('');
  portraitGrid.innerHTML = cards.filter((_, i) => gallery[i].orientation === 'portrait').join('');
  document.querySelector('.demo-wall').addEventListener('click', event => {
    const button = event.target.closest('[data-clip]');
    if (!button) return;
    openClip(Number(button.dataset.clip), gallery);
  });
  icons();
}

async function openClip(index, collection = activeGallery) {
  if (index < 0 || index >= collection.length) return;
  activeGallery = collection;
  currentClip = index;
  const clip = collection[index];
  const request = ++playbackRequest;
  playerVideo.pause();
  playerError.hidden = true;
  document.querySelector('#player-title').textContent = clip.title;
  document.querySelector('#player-meta').textContent = `${clip.setup} \u00b7 ${clip.playback_speed || 3}\u00d7 speed`;
  document.querySelector('#player-counter').textContent = `${index + 1} / ${collection.length}`;
  document.querySelector('#player-prev').disabled = index === 0;
  document.querySelector('#player-next').disabled = index === collection.length - 1;
  playerVideo.poster = clip.poster;
  player.classList.toggle('is-portrait', clip.orientation === 'portrait');
  player.classList.toggle('is-square', clip.orientation === 'square');
  playerVideo.setAttribute('aria-label', clip.title);
  playerVideo.src = clip.video;
  if (!player.open) {
    document.body.classList.add('player-open');
    player.showModal();
  }
  syncDatasetPreviews();
  try { await playerVideo.play(); }
  catch (error) {
    // Switching clips can abort a previous play request without a media failure.
    if (request !== playbackRequest || error.name === 'AbortError') return;
    playerError.innerHTML = `Video could not play. <a href="${clip.video}" target="_blank" rel="noreferrer">Open video</a>`;
    playerError.hidden = false;
  }
}

function releasePlayer() {
  playbackRequest++;
  playerVideo.pause();
  playerVideo.removeAttribute('src');
  playerVideo.removeAttribute('poster');
  playerVideo.load();
  document.body.classList.remove('player-open');
  syncDatasetPreviews();
}

function closePlayer() {
  releasePlayer();
  player.close();
  syncDatasetPreviews();
}

document.querySelector('#player-close').addEventListener('click', closePlayer);
document.querySelector('#player-prev').addEventListener('click', () => openClip(currentClip - 1));
document.querySelector('#player-next').addEventListener('click', () => openClip(currentClip + 1));
player.addEventListener('cancel', event => {
  event.preventDefault();
  closePlayer();
});
player.addEventListener('close', () => {
  if (!player.open && document.body.classList.contains('player-open')) releasePlayer();
});
player.addEventListener('click', event => {
  const rect = player.getBoundingClientRect();
  if (event.target === player && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closePlayer();
});
player.addEventListener('keydown', event => {
  if (event.target === playerVideo) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    openClip(currentClip + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

function renderExamples(examples) {
  const groups = [...new Set(examples.map(e => e.group))];
  const colors = ['#377da0','#ce8060','#8e78b3','#c66684','#44949d','#999849','#53987c','#af715d'];
  const clips = examples.map(e => ({...e, poster: `${e.image}?v=dataset-video-1`, setup: 'UMI demonstration'}));
  const target = document.querySelector('#task-examples');
  target.innerHTML = groups.map((group,i) => `<section class="example-group" style="--group-color:${colors[i]}"><h4>${escapeHtml(group)}</h4><div class="example-images">${clips.filter(e => e.group === group).map(e => `<figure class="example"><div class="example-media"><video class="dataset-video" muted loop playsinline preload="none" poster="${e.poster}" data-src="${e.video}" aria-hidden="true"></video><button class="example-open" type="button" data-example="${clips.indexOf(e)}" aria-label="Enlarge ${escapeHtml(e.title)}" title="Enlarge ${escapeHtml(e.title)}"><span><i data-lucide="maximize-2" aria-hidden="true"></i></span></button></div><figcaption>${escapeHtml(e.title)}</figcaption></figure>`).join('')}</div></section>`).join('');
  target.addEventListener('click', event => {
    const button = event.target.closest('[data-example]');
    if (button) openClip(Number(button.dataset.example), clips);
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= .15) visibleDatasetVideos.add(entry.target);
      else visibleDatasetVideos.delete(entry.target);
    });
    syncDatasetPreviews();
  }, {threshold: [0, .15]});
  target.querySelectorAll('video').forEach(video => { video.muted = true; observer.observe(video); });
  updateDatasetMotionButton();
  icons();
}

function syncDatasetPreviews() {
  document.querySelectorAll('.dataset-video').forEach(video => {
    const play = datasetMotionEnabled && !document.hidden && !player.open && visibleDatasetVideos.has(video);
    if (play) {
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      if (video.paused) video.play().catch(() => {});
    } else video.pause();
  });
}

function updateDatasetMotionButton() {
  const button = document.querySelector('#dataset-motion');
  const label = datasetMotionEnabled ? 'Pause dataset previews' : 'Play dataset previews';
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(!datasetMotionEnabled));
  button.innerHTML = `<i data-lucide="${datasetMotionEnabled ? 'pause' : 'play'}" aria-hidden="true"></i>`;
  icons();
}

document.querySelector('#dataset-motion').addEventListener('click', () => {
  datasetMotionEnabled = !datasetMotionEnabled;
  updateDatasetMotionButton();
  syncDatasetPreviews();
});
document.addEventListener('visibilitychange', syncDatasetPreviews);

function renderCoverage(stats) {
  const max = Math.max(...stats.coverage.flat());
  document.querySelector('#heatmap').insertAdjacentHTML('beforeend', `<thead><tr><th scope="col">Skill / object</th>${stats.object_domains.map(s => `<th scope="col">${escapeHtml(s)}</th>`).join('')}</tr></thead><tbody>${stats.coverage.map((row,i) => `<tr><th scope="row">${escapeHtml(stats.coverage_rows[i])}</th>${row.map((value,j) => {
    const t = value === 0 ? 0 : Math.sqrt(value/max);
    const color = [234,241,238].map((v,k) => Math.round(v+([37,105,95][k]-v)*t));
    return `<td style="background:rgb(${color.join(',')});color:${t > .6 ? '#ffffff':'#334b46'}" title="${escapeHtml(stats.coverage_rows[i])} / ${escapeHtml(stats.object_domains[j])}: ${value}">${value || '&ndash;'}</td>`;
  }).join('')}</tr>`).join('')}</tbody>`);
}

icons();
getData('data/demos.json?v=gallery-2').then(renderDemos).catch(error => {
  grid.innerHTML = '<p>Unable to load demonstrations. Please refresh the page.</p>';
  console.error(error);
});
getData('data/examples.json?v=dataset-video-1').then(renderExamples).catch(console.error);
getData('data/dataset_stats.json').then(renderCoverage).catch(console.error);
