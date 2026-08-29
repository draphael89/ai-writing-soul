(() => {
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  document.querySelectorAll('.custom-player').forEach(player => {
    const audio = player.querySelector('audio');
    const button = player.querySelector('.play-button');
    const bar = player.querySelector('.progress');
    const fill = player.querySelector('.progress-fill');
    const time = player.querySelector('.time');
    if (!audio || !button || !bar || !fill || !time) return;

    const fallbackDuration = parseFloat(player.dataset.duration) || 0;
    const duration = () => (isFinite(audio.duration) && audio.duration > 0) ? audio.duration : fallbackDuration;
    const playLabel = button.getAttribute('aria-label') || 'Play audio';
    const pauseLabel = playLabel.replace(/^Play/, 'Pause');

    const render = () => {
      const d = duration();
      fill.style.width = d ? `${(audio.currentTime / d) * 100}%` : '0%';
      time.textContent = `${fmt(audio.currentTime)} / ${d ? fmt(d) : '–:––'}`;
    };
    const setState = playing => {
      button.textContent = playing ? '❚❚' : '▶';
      button.setAttribute('aria-label', playing ? pauseLabel : playLabel);
    };

    button.addEventListener('click', () => { audio.paused ? audio.play() : audio.pause(); });
    audio.addEventListener('play', () => setState(true));
    audio.addEventListener('pause', () => setState(false));
    audio.addEventListener('ended', () => { audio.currentTime = 0; setState(false); render(); });
    audio.addEventListener('timeupdate', render);
    audio.addEventListener('loadedmetadata', render);

    const seekTo = t => {
      const d = duration();
      if (!d) return;
      audio.currentTime = Math.max(0, Math.min(d, t));
      render();
    };
    bar.addEventListener('click', e => {
      const rect = bar.getBoundingClientRect();
      seekTo(((e.clientX - rect.left) / rect.width) * duration());
    });
    bar.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(audio.currentTime + 15); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(audio.currentTime - 15); }
    });

    render();
  });
})();
