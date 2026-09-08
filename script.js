const WHATSAPP = '5511997384383';

const state = {
  query: '',
  brand: 'Todos',
  category: 'Todas',
  size: 'Todos',
  sort: 'featured'
};

let products = [];
let selectedProduct = null;
let selectedSize = '';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

async function init() {
  try {
    const response = await fetch('data/products.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    products = await response.json();
    products = products.filter((product) => product.status === 'published');
    const totalLabel = $('#catalogTotal');
    if (totalLabel) totalLabel.textContent = `${products.length} modelos no catálogo`;

    buildFilters();
    bindEvents();
    render();
  } catch (error) {
    console.error('Falha ao carregar o catálogo:', error);
    $('#resultCount').textContent = 'Catálogo temporariamente indisponível';
    $('#empty').style.display = 'block';
    $('#empty').textContent = 'Não foi possível carregar os produtos agora. Tente atualizar a página.';
  }
}

function unique(key) {
  return [...new Set(products.map((product) => product[key]).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function buildFilters() {
  $('#brandFilters').innerHTML = ['Todos', ...unique('brand')]
    .map((value) => `<button class="check ${value === 'Todos' ? 'selected' : ''}" data-brand="${value}">${value}</button>`)
    .join('');

  $('#categoryFilters').innerHTML = ['Todas', ...unique('category')]
    .map((value) => `<button class="check ${value === 'Todas' ? 'selected' : ''}" data-category="${value}">${value}</button>`)
    .join('');

  const sizes = [...new Set(products.flatMap((product) => product.sizes))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  $('#sizeFilters').innerHTML = ['Todos', ...sizes]
    .map((value) => `<button class="size-check ${value === 'Todos' ? 'selected' : ''}" data-size="${value}">${value}</button>`)
    .join('');
}

function bindEvents() {
  $('#search').addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });

  $('#sort').addEventListener('change', (event) => {
    state.sort = event.target.value;
    render();
  });

  $('#filterToggle').addEventListener('click', () => {
    $('#filterPanel').classList.toggle('open');
  });

  $('#clearFilters').addEventListener('click', () => {
    state.brand = 'Todos';
    state.category = 'Todas';
    state.size = 'Todos';
    state.query = '';
    $('#search').value = '';
    syncFilters();
    render();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const card = event.target.closest('[data-product]');
      if (card && document.activeElement === card) {
        event.preventDefault();
        const product = products.find((item) => item.id === card.dataset.product);
        if (product) openModal(product);
      }
    }
  });

  document.addEventListener('click', (event) => {
    const brand = event.target.closest('[data-brand]');
    if (brand) {
      state.brand = brand.dataset.brand;
      syncFilters();
      render();
      return;
    }

    const category = event.target.closest('[data-category]');
    if (category) {
      state.category = category.dataset.category;
      syncFilters();
      render();
      return;
    }

    const size = event.target.closest('[data-size]');
    if (size) {
      state.size = size.dataset.size;
      syncFilters();
      render();
      return;
    }

    const card = event.target.closest('[data-product]');
    if (card) {
      const product = products.find((item) => item.id === card.dataset.product);
      if (product) openModal(product);
      return;
    }

    if (event.target.matches('[data-close]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  $('#menuBtn').addEventListener('click', () => {
    $('.nav').classList.toggle('open');
  });

  $$('.nav a').forEach((link) => link.addEventListener('click', () => {
    $('.nav').classList.remove('open');
  }));
}

function syncFilters() {
  $$('#brandFilters .check').forEach((button) => {
    button.classList.toggle('selected', button.dataset.brand === state.brand);
  });

  $$('#categoryFilters .check').forEach((button) => {
    button.classList.toggle('selected', button.dataset.category === state.category);
  });

  $$('#sizeFilters .size-check').forEach((button) => {
    button.classList.toggle('selected', button.dataset.size === state.size);
  });
}

function filteredProducts() {
  const query = normalize(state.query);

  const list = products.filter((product) => {
    const searchable = normalize([
      product.brand,
      product.name,
      product.color,
      product.category,
      product.subcategory,
      ...(product.tags || [])
    ].join(' '));

    return (!query || searchable.includes(query))
      && (state.brand === 'Todos' || product.brand === state.brand)
      && (state.category === 'Todas' || product.category === state.category)
      && (state.size === 'Todos' || product.sizes.includes(state.size));
  });

  if (state.sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  } else if (state.sort === 'brand') {
    list.sort((a, b) => a.brand.localeCompare(b.brand, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
  } else {
    list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  return list;
}

function render() {
  const list = filteredProducts();
  const count = list.length;
  $('#resultCount').textContent = `${count} ${count === 1 ? 'modelo encontrado' : 'modelos encontrados'}`;
  $('#productGrid').innerHTML = list.map(card).join('');
  $('#empty').style.display = count ? 'none' : 'block';
}

function imageMarkup(product, context = 'card') {
  if (!product.image) {
    return `<div class="product-placeholder" role="img" aria-label="Imagem em atualização">
      <strong>${product.brand.toUpperCase()}</strong>
      <small>IMAGEM EM ATUALIZAÇÃO</small>
    </div>`;
  }

  return `<img src="${product.image}" alt="${product.name} ${product.color}" loading="${context === 'card' ? 'lazy' : 'eager'}" onerror="this.closest('.product-media, .modal-image').innerHTML='<div class=&quot;product-placeholder&quot;><strong>${product.brand.toUpperCase()}</strong><small>IMAGEM INDISPONÍVEL</small></div>'">`;
}

function card(product) {
  return `<article class="product" data-product="${product.id}" tabindex="0" aria-label="Abrir ${product.name} ${product.color}">
    <div class="product-media">
      ${product.featured ? '<span class="badge">DESTAQUE</span>' : ''}
      ${imageMarkup(product)}
    </div>
    <div class="product-info">
      <span class="product-brand">${product.brand}</span>
      <h3>${product.name}</h3>
      ${product.color ? `<div class="product-model">${product.color}</div>` : ''}
      <div class="sizes">${product.sizes.map((size) => `<span class="size">${size}</span>`).join('')}</div>
      <button class="consult" type="button">Consultar preço <span>→</span></button>
    </div>
  </article>`;
}

function openModal(product) {
  selectedProduct = product;
  selectedSize = '';

  $('#modalBrand').textContent = product.brand;
  $('#modalName').textContent = product.name;
  $('#modalModel').textContent = `${product.color ? product.color + ' • ' : ''}${product.subcategory || product.category}`;
  $('#modalImage').innerHTML = imageMarkup(product, 'modal');

  $('#modalSizes').innerHTML = product.sizes.map((size) =>
    `<button class="modal-size" type="button" data-modal-size="${size}">${size}</button>`
  ).join('');

  $$('#modalSizes .modal-size').forEach((button) => {
    button.addEventListener('click', () => {
      selectedSize = button.dataset.modalSize;
      $$('#modalSizes .modal-size').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      updateWhatsApp();
    });
  });

  updateWhatsApp();
  $('#modal').classList.add('show');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function updateWhatsApp() {
  if (!selectedProduct) return;

  let text = `Olá! Vi o ${selectedProduct.name} “${selectedProduct.color}” no catálogo da Muka Imports e gostaria de consultar o preço.`;
  text += selectedSize
    ? ` Tenho interesse no tamanho ${selectedSize}.`
    : ' Ainda estou escolhendo o tamanho.';

  $('#modalWhatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function closeModal() {
  $('#modal').classList.remove('show');
  $('#modal').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

init();
