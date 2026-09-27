/* Music and sound effects. */

function chord(fs, d = 0.5) {
  fs.forEach((f, i) => setTimeout(() => beep(f, d, "triangle", 0.15), i * 55));
}

function mtone(f, dur, type, vol) {
  if (!f) return;
  try {
    const a = actx();
    const o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.frequency.value = f;
    o.connect(g);
    g.connect(a.destination);
    const t = a.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {}
}

function musicStep() {
  if (!music.on) return;
  const i = music.step % LEAD.length;
  const l = LEAD[i];
  mtone(l, 0.17, "square", 0.045);
  const hm = HARM[i];
  if (hm) mtone(hm, 0.2, "triangle", 0.03);
  const b = BASSROOT[Math.floor(music.step / 2) % BASSROOT.length];
  if (music.step % 2 === 0) mtone(b, 0.24, "triangle", 0.06);
  music.step++;
}

function rebornCry() {
  try {
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Ahh");
      u.rate = 1.65;
      u.pitch = 1.2;
      u.volume = 0.48;
      window.speechSynthesis.speak(u);
      return;
    }
  } catch (e) {}
  beep(330, 0.1, "sine", 0.11);
  setTimeout(() => beep(245, 0.22, "triangle", 0.09), 55);
}

function stopAllMp3() {
  MUSIC_TRACKS.forEach(t => {
    if (t.id !== "chiptune") {
      const a = document.getElementById(t.id);
      if (a) {
        try {
          a.pause();
        } catch (e) {}
      }
    }
  });
  currentMp3 = null;
}

function playMp3(id) {
  if (music.timer) {
    clearInterval(music.timer);
    music.timer = null;
    music.started = false;
  }
  stopAllMp3();
  if (!music.on) return;
  const a = document.getElementById(id);
  if (!a) return;
  a.loop = true;
  a.volume = MUSIC_VOL;
  try {
    a.playbackRate = musicRate;
  } catch (e) {}
  currentMp3 = a;
  const pr = a.play();
  if (pr && pr.catch) pr.catch(() => {});
}

function applyMusicSelection() {
  const tr = MUSIC_TRACKS[S.musicTrack || 0];
  if (!tr || tr.id === "chiptune") {
    stopAllMp3();
    if (music.on) {
      music.started = false;
      startMusicBase();
    }
  } else {
    playMp3(tr.id);
  }
}

function renderMusicBtn() {
  const b = $("musicselV50");
  if (!b) return;
  const tr = MUSIC_TRACKS[S.musicTrack || 0];
  b.innerHTML = "🎵 " + tr.name;
  b.title = tr.credit + "  ·  click to change track";
}

function cycleMusic() {
  S.musicTrack = ((S.musicTrack || 0) + 1) % MUSIC_TRACKS.length;
  try {
    scheduleSave();
  } catch (e) {}
  if (!music.on) {
    music.on = true;
    $("musicbtn").textContent = "🔊";
  }
  try {
    actx();
  } catch (e) {}
  applyMusicSelection();
  renderMusicBtn();
}

function ensureAudioState() {
  const musicVolume = S.musicVolume == null ? 0.34 : Number(S.musicVolume);
  const sfxVolume = S.sfxVolume == null ? 1 : Number(S.sfxVolume);
  S.musicVolume = Math.max(0, Math.min(1, musicVolume));
  S.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
  S.musicChoice = ["random", "1", "2", "3"].includes(String(S.musicChoice))
    ? String(S.musicChoice)
    : S.musicTrack >= 1 && S.musicTrack <= 3
      ? String(S.musicTrack)
      : "random";
  S.musicEnabled = S.musicEnabled == null ? true : !!S.musicEnabled;
  music.on = S.musicEnabled;
}

function stopRecordedMusic() {
  AUDIO_TRACKS.forEach(t => {
    const a = $(t.id);
    if (a) {
      a.onended = null;
      try {
        a.pause();
      } catch (e) {}
    }
  });
  currentAudio = null;
  if (music.timer) {
    clearInterval(music.timer);
    music.timer = null;
    music.started = false;
  }
}

function chosenTrack(next) {
  let choice = S.musicChoice;
  if (choice === "random") {
    let pool = AUDIO_TRACKS.filter(t => t.value !== lastRandomTrack);
    if (!pool.length) pool = AUDIO_TRACKS.slice();
    const t = pool[Math.floor(Math.random() * pool.length)];
    lastRandomTrack = t.value;
    return t;
  }
  return AUDIO_TRACKS.find(t => t.value === choice) || AUDIO_TRACKS[0];
}

function playChosenMusic(next) {
  ensureAudioState();
  if (!music.on) {
    stopRecordedMusic();
    return;
  }
  const track = chosenTrack(next);
  stopRecordedMusic();
  const a = $(track.id);
  if (!a) return;
  currentAudio = a;
  a.volume = S.musicVolume;
  a.playbackRate = audioRate;
  a.loop = S.musicChoice !== "random";
  a.onended = S.musicChoice === "random" ? () => playChosenMusic(true) : null;
  try {
    a.currentTime = 0;
  } catch (e) {}
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
  music.started = true;
}

// Earlier version of startMusic(), extended by the functions that follow.
function startMusicBase() {
  if (music.started) return;
  music.started = true;
  actx();
  music.timer = setInterval(musicStep, musicMs);
}

function startMusic() {
  if (music.on && (!currentAudio || currentAudio.paused)) playChosenMusic(false);
}

// Earlier version of setTempo(), extended by the functions that follow.
function setTempoBase(ms) {
  prev78: {
    if (ms === musicMs) break prev78;
    musicMs = ms;
    if (music.started && music.timer) {
      clearInterval(music.timer);
      music.timer = setInterval(musicStep, musicMs);
    }
  }
  musicRate = ms <= 200 ? 1.1 : 1.0;
  if (currentMp3) {
    try {
      glideMusicRate(currentMp3, musicRate);
    } catch (e) {}
  }
}

function setTempo(ms) {
  const result = setTempoBase(ms);
  audioRate = ms <= 200 ? 1.1 : 1;
  if (currentAudio) glideMusicRate(currentAudio, audioRate);
  return result;
}

// Change the music speed smoothly. Browsers stretch audio to keep the pitch when the speed
// changes, and that re-tuning causes an audible break. Letting the pitch follow the speed
// (like a record spinning faster) plus a short glide makes the boss speed-up seamless.
function glideMusicRate(a, target) {
  try {
    a.preservesPitch = false;
    a.mozPreservesPitch = false;
    a.webkitPreservesPitch = false;
  } catch (e) {}
  clearInterval(a._rateGlide);
  const start = a.playbackRate || 1,
    steps = 12;
  if (Math.abs(start - target) < 0.001) return;
  let i = 0;
  a._rateGlide = setInterval(() => {
    i++;
    try {
      a.playbackRate = start + ((target - start) * i) / steps;
    } catch (e) {}
    if (i >= steps) clearInterval(a._rateGlide);
  }, 50);
}

// Earlier version of beep(), extended by the functions that follow.
function beepBase(f, d = 0.08, t = "square", v = 0.13) {
  try {
    const a = actx();
    const o = a.createOscillator(),
      g = a.createGain();
    o.type = t;
    o.frequency.value = f;
    o.connect(g);
    g.connect(a.destination);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d);
    o.start();
    o.stop(a.currentTime + d);
  } catch (e) {}
}

function beep(f, d, t, v) {
  ensureAudioState();
  const base = v == null ? 0.13 : v;
  return beepBase(f, d, t, base * S.sfxVolume);
}

function updateAudioModal() {
  ensureAudioState();
  const mv = $("musicvolv54"),
    sv = $("sfxvolv54"),
    sel = $("musicchoicev54"),
    tog = $("musictogglev54");
  if (mv) mv.value = Math.round(S.musicVolume * 100);
  if (sv) sv.value = Math.round(S.sfxVolume * 100);
  if (sel) sel.value = S.musicChoice;
  if (tog) tog.textContent = music.on ? "🔊 Music on" : "🔇 Music off";
  $("musicbtn").textContent = music.on ? "🔊" : "🔇";
}

function installAudioModal() {
  if ($("audiosettingsv54")) return;
  const modal = document.createElement("div");
  modal.id = "audiosettingsv54";
  modal.className = "skover";
  modal.innerHTML =
    '<div class="skbox audiosettingsboxv54"><div class="skhead">AUDIO SETTINGS</div><label>Music volume <input id="musicvolv54" type="range" min="0" max="100" step="1"></label><label>SFX volume <input id="sfxvolv54" type="range" min="0" max="100" step="1"></label><label>Music order <select id="musicchoicev54"><option value="random">Random succession</option><option value="1">Game 8bit</option><option value="2">Return of the 8bit Era</option><option value="3">8bit Retro Game Music</option></select></label><button id="musictogglev54" class="ghost" type="button"></button><button id="audioclosev54" class="up" type="button">Done</button></div>';
  document.body.appendChild(modal);
  $("musicvolv54").oninput = e => {
    S.musicVolume = Number(e.target.value) / 100;
    if (currentAudio) currentAudio.volume = S.musicVolume;
    scheduleSave();
  };
  $("sfxvolv54").oninput = e => {
    S.sfxVolume = Number(e.target.value) / 100;
    scheduleSave();
  };
  $("musicchoicev54").onchange = e => {
    S.musicChoice = e.target.value;
    lastRandomTrack = null;
    if (music.on) playChosenMusic(false);
    scheduleSave();
  };
  $("musictogglev54").onclick = () => {
    music.on = !music.on;
    S.musicEnabled = music.on;
    if (music.on) playChosenMusic(false);
    else stopRecordedMusic();
    updateAudioModal();
    scheduleSave();
  };
  $("audioclosev54").onclick = () => modal.classList.remove("on");
}

function playingAudio() {
  for (var i = 0; i < TRACKS.length; i++) {
    var a = document.getElementById(TRACKS[i]);
    if (a && !a.paused) return a;
  }
  return null;
}

function baseVol() {
  try {
    return typeof S !== "undefined" && S && S.musicVolume != null ? Number(S.musicVolume) : 0.34;
  } catch (e) {
    return 0.34;
  }
}

function ramp(to, ms) {
  if (raf) cancelAnimationFrame(raf);
  var a = playingAudio();
  if (!a) {
    return;
  }
  var from = a.volume,
    t0 = null;
  function step(ts) {
    if (t0 == null) t0 = ts;
    var p = ms <= 0 ? 1 : Math.min(1, (ts - t0) / ms),
      v = from + (to - from) * p,
      aa = playingAudio();
    if (aa) aa.volume = Math.max(0, Math.min(1, v));
    if (p < 1) raf = requestAnimationFrame(step);
    else raf = null;
  }
  raf = requestAnimationFrame(step);
}

function trackRow(id, track, label, valTxt) {
  var a = ensureState_p21();
  var mx = track === "pow" ? POWMAX : track === "dur" ? DURMAX : CDMAX;
  var cur = a[track][id] || 0;
  var can = S.spA > 0 && cur < mx;
  return (
    '<div class="trkv111"><span class="tl">' +
    label +
    "</span>" +
    pips(cur, mx, ACT[id].col) +
    '<button class="pmv111" data-inc="' +
    track +
    ":" +
    id +
    '"' +
    (can ? "" : " disabled") +
    '>+</button><span class="tval">' +
    valTxt +
    "</span></div>"
  );
}
