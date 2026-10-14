(() => {
  'use strict';
  const tracks = window.GARDEN_TRACKS || [];
  const $ = id => document.getElementById(id);
  const format = n => Number.isFinite(n) ? `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}` : '--:--';
  let selected = 0, repeating = false, muted = false;
  const entries = tracks.map((track, index) => {
    const audio = new Audio(); audio.preload = 'metadata';
    const row = document.createElement('button'); row.type = 'button'; row.className = 'track-row'; row.setAttribute('aria-pressed', String(index === 0));
    const number = document.createElement('span'); number.className = 'row-number'; number.textContent = String(index + 1).padStart(2, '0');
    const image = document.createElement('img'); image.src = track.image; image.alt = '';
    const title = document.createElement('span'); title.className = 'row-title'; title.textContent = track.title;
    const state = document.createElement('span'); state.className = 'row-state'; state.textContent = '준비 중';
    row.append(number, image, title, state); row.setAttribute('aria-label', `${track.title} 선택`); $('tracks').append(row);
    const entry = { audio, row, state, ready: false, failed: false };
    row.addEventListener('click', () => select(index));
    audio.addEventListener('loadedmetadata', () => {
      entry.ready = true; entry.failed = false; state.textContent = format(audio.duration);
      if (selected === index) update();
    });
    audio.addEventListener('error', () => {
      entry.ready = false; entry.failed = true; state.textContent = '공개 준비 중';
      if (selected === index) update();
    });
    audio.addEventListener('play', () => { entries.forEach(e => { if (e.audio !== audio) e.audio.pause(); }); if (selected === index) update(); });
    audio.addEventListener('pause', () => { if (selected === index) update(); });
    audio.addEventListener('timeupdate', () => { if (selected === index) updateTime(); });
    audio.addEventListener('ended', () => {
      if (selected !== index) return;
      if (repeating) { audio.currentTime = 0; playCurrent(); return; }
      const next = entries.findIndex((e, i) => i > selected && e.ready);
      if (next >= 0) { select(next); playCurrent(); } else update();
    });
    return entry;
  });
  function updateTime() {
    const audio = entries[selected]?.audio; if (!audio) return;
    $('elapsed').textContent = format(audio.currentTime);
    $('duration').textContent = format(audio.duration);
    $('seek').value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration * 100 : 0;
    $('seek').setAttribute('aria-valuetext', `${format(audio.currentTime)} / ${format(audio.duration)}`);
  }
  function update() {
    const entry = entries[selected]; if (!entry) return;
    const isPlaying = entry.ready && !entry.audio.paused && !entry.audio.ended;
    $('play').disabled = !entry.ready; $('seek').disabled = !entry.ready || !Number.isFinite(entry.audio.duration);
    $('play').setAttribute('aria-label', isPlaying ? '일시정지' : '재생');
    $('play-icon').innerHTML = isPlaying ? '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>' : '<path d="m8 4 12 8-12 8Z"/>';
    $('vinyl').classList.toggle('playing', isPlaying); $('tonearm').classList.toggle('playing', isPlaying); $('deck-light').classList.toggle('on', isPlaying);
    $('player-status').textContent = !entry.ready ? '음원 공개 준비 중입니다.' : isPlaying ? '국가정원의 소리를 듣고 있어요.' : '재생 버튼을 눌러 들어보세요.';
    entries.forEach((e, i) => { e.row.setAttribute('aria-pressed', String(i === selected)); e.state.textContent = e.ready ? (i === selected && isPlaying ? '재생 중' : format(e.audio.duration)) : '공개 준비 중'; });
    updateTime();
  }
  function select(index) {
    entries.forEach(e => e.audio.pause()); selected = (index + entries.length) % entries.length;
    const track = tracks[selected]; $('current-title').textContent = track.title; $('current-number').textContent = `TRACK ${String(selected + 1).padStart(2, '0')}`; $('current-art').src = track.image;
    update();
  }
  async function playCurrent() {
    const entry = entries[selected]; if (!entry?.ready) return;
    try { await entry.audio.play(); } catch { $('player-status').textContent = '재생 버튼을 다시 눌러주세요.'; }
  }
  $('play').addEventListener('click', () => { const audio = entries[selected]?.audio; if (!audio) return; if (audio.paused) playCurrent(); else { audio.pause(); update(); } });
  $('previous').addEventListener('click', () => select(selected - 1)); $('next').addEventListener('click', () => select(selected + 1));
  $('seek').addEventListener('input', () => { const audio = entries[selected].audio; if (Number.isFinite(audio.duration)) audio.currentTime = Number($('seek').value) / 100 * audio.duration; updateTime(); });
  $('repeat').addEventListener('click', () => { repeating = !repeating; $('repeat').setAttribute('aria-pressed', String(repeating)); });
  $('mute').addEventListener('click', () => { muted = !muted; entries.forEach(e => { e.audio.muted = muted; }); $('mute').setAttribute('aria-pressed', String(muted)); $('mute').setAttribute('aria-label', muted ? '음소거 해제' : '음소거'); });
  entries.forEach((entry, index) => { entry.audio.src = tracks[index].file; });
  if (entries.length) select(0);
})();
