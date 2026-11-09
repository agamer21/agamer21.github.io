const button = document.querySelector('#fullscreen');
const status = document.querySelector('#fullscreen-status');
const link = document.querySelector('[data-side-link]');
const edit = document.querySelector('#edit-side-link');
const linkKey = 'agArcade.geometryDash.sideLink.v1';
let sideLink;
try { sideLink = JSON.parse(localStorage.getItem(linkKey)); } catch {}

function applyLink() {
  let url;
  try { url = new URL(sideLink?.url); } catch {}
  const visible = Boolean(sideLink?.label && ['https:', 'http:'].includes(url?.protocol));
  link.hidden = !visible;
  if (visible) {
    link.href = url.href;
    link.textContent = sideLink.label;
  } else {
    link.removeAttribute('href');
    link.textContent = '';
  }
  edit.textContent = visible ? 'Edit side link' : 'Set side link';
}

const dialog = document.createElement('dialog');
dialog.className = 'side-link-dialog';
dialog.innerHTML = `
  <form method="dialog">
    <h2>Side link</h2>
    <p>Saved in this browser for both Geometry Dash pages.</p>
    <label>Label <input name="label" required maxlength="60"></label>
    <label>URL <input name="url" type="url" placeholder="https://example.com" required></label>
    <div class="round-actions">
      <button value="save">Save</button>
      <button value="remove" formnovalidate>Remove</button>
      <button value="cancel" formnovalidate>Cancel</button>
    </div>
  </form>`;
document.body.append(dialog);
const form = dialog.querySelector('form');
form.addEventListener('submit', event => {
  const action = event.submitter?.value;
  if (action === 'cancel') return;
  if (action !== 'remove') {
    const url = new URL(form.elements.url.value);
    if (!['https:', 'http:'].includes(url.protocol)) {
      event.preventDefault();
      form.elements.url.setCustomValidity('Use an http or https URL.');
      form.elements.url.reportValidity();
      return;
    }
    sideLink = { label: form.elements.label.value.trim(), url: url.href };
  } else {
    sideLink = null;
  }
  try { localStorage.setItem(linkKey, JSON.stringify(sideLink)); } catch {}
  applyLink();
});
form.elements.url.addEventListener('input', () => form.elements.url.setCustomValidity(''));
edit.addEventListener('click', () => {
  form.elements.label.value = sideLink?.label ?? '';
  form.elements.url.value = sideLink?.url ?? '';
  form.elements.url.setCustomValidity('');
  dialog.showModal();
});
applyLink();

function syncFullscreen() {
  const active = Boolean(document.fullscreenElement);
  button.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
  button.setAttribute('aria-pressed', String(active));
}

button.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    status.hidden = true;
  } catch {
    status.textContent = 'Fullscreen is unavailable in this browser.';
    status.hidden = false;
  }
});
document.addEventListener('fullscreenchange', syncFullscreen);
