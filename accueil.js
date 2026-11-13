const tray = new Map();
const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

const trayWidget = document.createElement('aside');
trayWidget.id = 'tray-widget';
trayWidget.className = 'fixed bottom-4 right-4 z-[60] w-56 max-w-[calc(100vw-2rem)]';
trayWidget.hidden = true;
trayWidget.innerHTML = `
  <section id="tray-panel" class="hidden mb-3 rounded-xl bg-white shadow-xl border border-secondary/20 overflow-hidden" aria-label="Contenu de votre plateau">
    <div class="flex items-center justify-between px-4 py-3 bg-surface-container-low">
      <h2 class="font-headline-sm text-headline-sm text-primary">Mon plateau</h2>
      <button id="tray-clear" type="button" class="text-sm font-semibold text-secondary hover:text-primary">Tout retirer</button>
    </div>
    <ul id="tray-items" class="p-4 space-y-3 max-h-64 overflow-y-auto"></ul>
    <div class="px-4 pb-4">
      <p id="tray-empty" class="text-sm text-on-surface-variant">Votre plateau est vide. Choisissez un thé, une pâtisserie ou une formule.</p>
      <div class="flex items-center justify-between border-t border-outline-variant/30 pt-3">
        <strong class="text-primary">Total</strong>
        <strong id="tray-panel-total" class="text-primary"></strong>
      </div>
      <button id="tray-order" type="button" class="btn w-full mt-3">Préparer ma demande</button>
    </div>
  </section>
  <button id="tray-toggle" type="button" aria-expanded="false" aria-controls="tray-panel" class="w-full rounded-xl bg-primary-container text-on-primary px-4 py-3 shadow-lg flex items-center justify-between gap-3 hover:bg-primary transition-colors">
    <span class="material-symbols-outlined" aria-hidden="true">shopping_bag</span>
    <span class="font-semibold">Mon plateau</span>
    <span id="tray-count" class="rounded-full bg-white/20 px-2 py-0.5">0</span>
    <span id="tray-total" class="ml-auto font-bold"></span>
  </button>
  <p id="tray-status" class="hidden mb-2 rounded-lg bg-white px-4 py-2 text-sm text-primary shadow-lg" role="status" aria-live="polite"></p>`;
document.body.append(trayWidget);

const itemList = document.querySelector('#tray-items');
const panel = document.querySelector('#tray-panel');
const toggle = document.querySelector('#tray-toggle');
let statusTimeout;

function setPanelOpen(open) {
  panel.classList.toggle('hidden', !open);
  toggle.setAttribute('aria-expanded', String(open));
}

function renderTray() {
  const items = Array.from(tray.values());
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  document.querySelector('#tray-count').textContent = String(count);
  document.querySelector('#tray-total').textContent = money.format(total);
  document.querySelector('#tray-panel-total').textContent = money.format(total);
  document.querySelector('#tray-empty').hidden = items.length > 0;
  itemList.replaceChildren();

  items.forEach(item => {
    const row = document.createElement('li');
    row.className = 'flex items-start justify-between gap-3 text-sm';
    const details = document.createElement('span');
    details.className = 'text-on-surface min-w-0 break-words';
    details.textContent = `${item.name} × ${item.quantity}`;
    const price = document.createElement('strong');
    price.className = 'text-primary whitespace-nowrap';
    price.textContent = money.format(item.price * item.quantity);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-secondary hover:text-primary ml-1';
    remove.setAttribute('aria-label', `Retirer ${item.name} du plateau`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      tray.delete(item.key);
      renderTray();
    });
    const actions = document.createElement('span');
    actions.className = 'flex items-center gap-2';
    actions.append(price, remove);
    row.append(details, actions);
    itemList.append(row);
  });
}

document.querySelectorAll('#menu-thes .grid > div, #patisseries .grid > div, #formules .grid > div').forEach(card => {
  const button = card.querySelector('button');
  const title = card.querySelector('h3');
  const priceElement = card.querySelector('.font-price-tag, .font-display');
  if (!button || !title || !priceElement) return;

  button.type = 'button';
  button.addEventListener('click', () => {
    const name = title.textContent.trim();
    const price = Number(priceElement.textContent.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!Number.isFinite(price)) return;

    const key = `${card.closest('section').id}:${name}`;
    const item = tray.get(key) || { key, name, price, quantity: 0 };
    item.quantity += 1;
    tray.set(key, item);
    trayWidget.hidden = false;
    renderTray();
    setPanelOpen(false);
    const status = document.querySelector('#tray-status');
    status.textContent = `${name} ajouté au plateau.`;
    status.classList.remove('hidden');
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => status.classList.add('hidden'), 3000);
  });
});

toggle.addEventListener('click', () => setPanelOpen(toggle.getAttribute('aria-expanded') !== 'true'));
document.querySelector('#tray-clear').addEventListener('click', () => {
  tray.clear();
  renderTray();
  document.querySelector('#tray-status').textContent = 'Le plateau a été vidé.';
});
document.querySelector('#tray-order').addEventListener('click', () => {
  const details = document.querySelector('#commande-details');
  const order = Array.from(tray.values())
    .map(item => `${item.quantity} × ${item.name} (${money.format(item.price * item.quantity)})`)
    .join(', ');
  if (order) details.value = [details.value.trim(), `Commande : ${order}`].filter(Boolean).join(' — ');
  setPanelOpen(false);
  document.querySelector('#reservation').scrollIntoView({ behavior: 'smooth' });
  details.focus({ preventScroll: true });
});
