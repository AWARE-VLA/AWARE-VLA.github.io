'use strict';
const grid = document.querySelector('#demo-grid');
const filters = document.querySelector('#demo-filters');
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = () => window.lucide?.createIcons();
const duration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

async function getData(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
  return response.json();
}

function renderDemos(demos) {
  const categories = ['All demos', 'Pick & place', 'Precision & tools', 'Memory & sequencing', 'Everyday skills'];
  filters.innerHTML = categories.map((group, i) => `<button class="filter" type="button" data-filter="${escapeHtml(group)}" aria-pressed="${i === 0}">${escapeHtml(group)}<span class="filter-count">${i === 0 ? demos.length : demos.filter(d => d.group === group).length}</span></button>`).join('');
  const order = ['demo-04','demo-03','demo-10','demo-05','demo-01','demo-02','demo-06','demo-07','demo-08','demo-09','demo-11','demo-12','demo-13','demo-14','demo-15','demo-16','demo-17','demo-18','demo-19','demo-20'];
  const ordered = [...demos].sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  grid.innerHTML = ordered.map((d, i) => `<figure class="demo-card" data-group="${escapeHtml(d.group)}" data-id="${d.id}">
    <div class="media-wrap" style="--ratio:${d.ratio}">
      <video class="demo-media" preload="none" playsinline muted poster="${d.poster}" aria-label="${escapeHtml(d.title)}" data-src="${d.video}"></video>
      <button class="play-cover" type="button" aria-label="Play ${escapeHtml(d.title)}" title="Play ${escapeHtml(d.title)}"><span><i data-lucide="play" aria-hidden="true"></i></span></button>
    </div>
    <figcaption class="demo-caption"><div><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.setup)} &middot; 3&times; speed</p></div><span class="duration">${duration(d.duration)}</span></figcaption>
    </figure>`).join('');
  document.querySelector('#demo-count').textContent = `${demos.length} / ${demos.length} clips`;
  grid.querySelectorAll('.demo-card').forEach(card => {
    const video = card.querySelector('video');
    const button = card.querySelector('.play-cover');
    async function play() {
      grid.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      video.controls = true;
      button.hidden = true;
      try { await video.play(); }
      catch {
        button.hidden = false;
        if (!card.querySelector('.play-error')) card.insertAdjacentHTML('beforeend', `<p class="play-error">Video could not play. <a href="${video.dataset.src}">Open video</a></p>`);
      }
    }
    button.addEventListener('click', play);
    video.addEventListener('play', () => grid.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); }));
    video.addEventListener('ended', () => { button.hidden = false; video.controls = false; });
  });
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const group = button.dataset.filter;
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let visible = 0;
    grid.querySelectorAll('.demo-card').forEach(card => {
      card.hidden = group !== 'All demos' && card.dataset.group !== group;
      if (card.hidden) card.querySelector('video').pause();
      else visible++;
    });
    document.querySelector('#demo-count').textContent = `${visible} / ${demos.length} clips`;
  });
  icons();
}

function renderExamples(examples) {
  const groups = [...new Set(examples.map(e => e.group))];
  const colors = ['#377da0','#ce8060','#8e78b3','#c66684','#44949d','#999849','#53987c','#af715d'];
  document.querySelector('#task-examples').innerHTML = groups.map((group,i) => `<section class="example-group" style="--group-color:${colors[i]}"><h4>${escapeHtml(group)}</h4><div class="example-images">${examples.filter(e => e.group === group).map(e => `<figure class="example"><a href="${e.image}" target="_blank" aria-label="Open ${escapeHtml(e.title)} observation"><img src="${e.image}" alt="UMI observation: ${escapeHtml(e.title)}" width="224" height="224" loading="lazy"></a><figcaption>${escapeHtml(e.title)}</figcaption></figure>`).join('')}</div></section>`).join('');
}

function renderCoverage(stats) {
  const max = Math.max(...stats.coverage.flat());
  document.querySelector('#heatmap').insertAdjacentHTML('beforeend', `<thead><tr><th scope="col">Skill / object</th>${stats.object_domains.map(s => `<th scope="col">${escapeHtml(s)}</th>`).join('')}</tr></thead><tbody>${stats.coverage.map((row,i) => `<tr><th scope="row">${escapeHtml(stats.coverage_rows[i])}</th>${row.map((value,j) => {
    const t = value === 0 ? 0 : Math.sqrt(value/max);
    const color = [234,241,238].map((v,k) => Math.round(v+([37,105,95][k]-v)*t));
    return `<td style="background:rgb(${color.join(',')});color:${t > .6 ? '#ffffff':'#334b46'}" title="${escapeHtml(stats.coverage_rows[i])} / ${escapeHtml(stats.object_domains[j])}: ${value}">${value || '&ndash;'}</td>`;
  }).join('')}</tr>`).join('')}</tbody>`);
}

icons();
getData('data/demos.json').then(renderDemos).catch(error => {
  grid.innerHTML = '<p>Unable to load demonstrations. Please refresh the page.</p>';
  console.error(error);
});
getData('data/examples.json').then(renderExamples).catch(console.error);
getData('data/dataset_stats.json').then(renderCoverage).catch(console.error);
