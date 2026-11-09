const colors = ['#0953d7','#174ad9','#6541ce','#9228a8','#9c219a','#6d31bb','#3c20b0'];
const ratings = [1,2,3,4,5,6,7,8,9,10,11,12,10,14,12,12,10,14,10,15,12,12];
const faces = [1,1,2,3,3,4,4,4,5,5,5,5,5,6,5,5,4,6,4,6,5,5];

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function control(label, className, onClick) {
  const button = el('button', className);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
}

export function renderLevelSelector(container, entries, index, options) {
  const entry = entries[index];
  const result = options.result(entry.id);
  const availability = options.availability(entry);
  const panel = el('section', 'level-selector');
  panel.setAttribute('aria-label', 'Level selection');
  panel.style.setProperty('--level-color', colors[index % colors.length]);

  function art(sprite, fallback, width, height) {
    const canvas = el('canvas', 'selector-art');
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute('aria-hidden', 'true');
    const paint = canvas.getContext('2d');
    return options.draw(sprite, width / 2, height / 2, 1, paint)
      ? canvas : el('span', 'selector-fallback', fallback);
  }

  const top = el('div', 'selector-top');
  const back = control('Back to main menu', 'selector-icon-button', options.back);
  back.append(art('GJ_backBtn_001.png', '‹', 58, 58));
  const info = control('Level information', 'selector-icon-button', () => {
    detail.hidden = !detail.hidden;
    info.setAttribute('aria-expanded', String(!detail.hidden));
  });
  info.setAttribute('aria-expanded', 'false');
  info.append(art('GJ_infoBtn_001.png', 'i', 54, 54));
  top.append(back, info);

  const left = control('Previous level', 'selector-arrow selector-left', () => options.navigate(-1));
  left.append(art('GJ_arrow_01_001.png', '‹', 60, 64));
  const right = control('Next level', 'selector-arrow selector-right', () => options.navigate(1));
  right.append(art('GJ_arrow_01_001.png', '›', 60, 64));

  const card = el('div', 'selector-center');
  const level = control(entry.name, 'selector-level', () => options.launch(entry));
  level.disabled = availability !== 'Ready';
  const heading = options.titleArt(entry.name) || el('span', 'selector-level-name', entry.name);
  const label = el('span', 'selector-level-label');
  if (entry.id <= 22) {
    const stars = el('span', 'selector-rating', String(ratings[index]));
    stars.append(art('GJ_starsIcon_001.png', '★', 28, 28));
    label.append(art('diffIcon_' + String(faces[index]).padStart(2, '0') + '_btn_001.png', '●', 52, 52), heading, stars);
  } else {
    label.append(art('theTowerDoor_001.png', '▣', 62, 62), heading);
  }
  level.append(label);
  card.append(level);

  if (entry.id <= 22) {
    const coins = el('div', 'selector-coins');
    const collected = result?.coins?.length || 0;
    coins.setAttribute('aria-label', collected + ' of 3 secret coins');
    for (let slot = 0; slot < 3; slot++) {
      const earned = result?.coinSlots ? result.coinSlots.includes(slot) : slot < collected;
      coins.append(art(earned ? 'GJ_coinsIcon_001.png' : 'GJ_coinsIcon_gray_001.png', earned ? '●' : '○', 31, 31));
    }
    card.append(coins);
    for (const [name, value, mode] of [
      ['Normal Mode', result?.best || 0, 'normal'],
      ['Practice Mode', result?.practiceBest || 0, 'practice'],
    ]) {
      const group = el('div', 'selector-progress ' + mode);
      const text = el('span', 'selector-mode', name);
      const track = el('div', 'selector-track');
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', name);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(value));
      const fill = el('span', 'selector-fill');
      fill.style.width = value + '%';
      track.append(fill, el('span', 'selector-percent', value + '%'));
      group.append(text, track);
      card.append(group);
    }
  }
  const detail = el('p', 'selector-detail', availability === 'Ready'
    ? 'Select the level name to play. Practice is in the pause menu.' : availability);
  detail.hidden = availability === 'Ready';
  info.setAttribute('aria-expanded', String(!detail.hidden));
  card.append(detail);

  const dots = el('nav', 'selector-dots');
  dots.setAttribute('aria-label', 'Level pages');
  entries.forEach((item, page) => {
    const dot = control(item.name + ' page', 'selector-dot', () => options.choose(page));
    if (page === index) dot.setAttribute('aria-current', 'page');
    dots.append(dot);
  });

  panel.append(top, left, card, right, dots);
  let touchX;
  panel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') touchX = event.clientX;
  });
  panel.addEventListener('pointercancel', () => { touchX = undefined; });
  panel.addEventListener('pointerup', event => {
    if (touchX === undefined || event.pointerType !== 'touch') return;
    const delta = event.clientX - touchX;
    touchX = undefined;
    if (Math.abs(delta) > 42) options.navigate(delta < 0 ? 1 : -1);
  });
  container.replaceChildren(panel);
}
