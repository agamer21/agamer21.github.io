const frame = document.getElementById('game');
document.getElementById('fullscreen').addEventListener('click', async () => {
  try {
    await frame.requestFullscreen();
    frame.focus();
  } catch {
    document.body.classList.toggle('expanded-player');
  }
});
