const WHATSAPP = "5511997384383";
const supplierImage = "https://acdn-us.mitiendanube.com/stores/001/648/013/products/tmp_b64_b67058ca-64b3-4fbf-95bc-48f6190114c0_1648013_5940194-35e6ffec0ba0991cf917526232016204-640-0.webp";
const tripleBlackImage = "https://acdn-us.mitiendanube.com/stores/001/648/013/products/tmp_b64_a9ff1445-a8af-4a07-a9e2-33d8ff1e94ed_1648013_5940194-d7bdf7a98a41e89c2817543135993959-640-0.webp";
const blackWhiteImage = "https://acdn-us.mitiendanube.com/stores/001/648/013/products/tmp_b64_3cd36fe9-14b2-4cf9-a333-0f4fc6b55efa_1648013_5940194-6264e05b550a83d85e17543132859678-640-0.webp";

const products = [
  {brand:"Nike", name:"Air Max TN Plus 1", color:"Nature Blue", model:"Air Max TN Plus 1", sizes:["38","39","40","41","42","43"], image:supplierImage, featured:true},
  {brand:"Nike", name:"Air Max TN Plus 1", color:"Triple Black", model:"Air Max TN Plus 1", sizes:["38","39","40","41","42","43"], image:tripleBlackImage, featured:true},
  {brand:"Nike", name:"Vapormax Plus", color:"Preto / Dourado", model:"Vapormax Plus", sizes:["38","39","40","41","42","43"], image:null, featured:true},
  {brand:"Nike", name:"Air Force 1", color:"Bege / Cinza", model:"Air Force 1", sizes:["38","39","40","41"], image:null, featured:true},
  {brand:"Nike", name:"Air Max TN Plus 1", color:"Black / White Importado", model:"Air Max TN Plus 1", sizes:["34","35","36","37","38","39","40","41"], image:blackWhiteImage, featured:true},
  {brand:"Adidas", name:"Ultraboost", color:"Preto", model:"Ultraboost", sizes:["38","39","40","41","42","43"], image:null},
  {brand:"Mizuno", name:"Pro X", color:"Azul", model:"Pro X", sizes:["38","39","40","41","42","43"], image:null},
  {brand:"New Balance", name:"Lifestyle", color:"Cinza", model:"New Balance", sizes:["38","39","40","41","42"], image:null}
];

const grid = document.getElementById("productGrid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");
let activeFilter = "Todos";

function waLink(p) {
  const text = `Olá! Quero consultar o preço do *${p.name} — ${p.color}*. Tamanho: `;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function card(p, index) {
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name} ${p.color}" loading="lazy">`
    : `<div class="product-placeholder"><strong>${p.brand.toUpperCase()}</strong><small>FOTO DO MODELO</small></div>`;
  return `
    <article class="product">
      <div class="product-media">
        ${p.featured ? '<span class="badge">DESTAQUE</span>' : ''}
        <button class="fav" aria-label="Favoritar">♡</button>
        ${media}
      </div>
      <div class="product-info">
        <span class="product-brand">${p.brand}</span>
        <h3>${p.name}</h3>
        <div class="product-model">${p.color}</div>
        <div class="sizes">${p.sizes.map(s => `<span class="size">${s}</span>`).join("")}</div>
        <button class="consult" data-index="${index}">◉ &nbsp; CONSULTAR PREÇO</button>
      </div>
    </article>`;
}

function render() {
  const q = search.value.toLowerCase().trim();
  const list = products.map((p,i)=>({p,i})).filter(x => {
    const p=x.p;
    const matchFilter = activeFilter === "Todos" || (activeFilter === "Outras" ? !["Nike","Adidas","Mizuno"].includes(p.brand) : p.brand === activeFilter);
    const matchSearch = !q || `${p.brand} ${p.name} ${p.color} ${p.model}`.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  grid.innerHTML = list.map(x=>card(x.p,x.i)).join("");
  empty.style.display = list.length ? "none" : "block";
  document.querySelectorAll(".consult").forEach(btn => btn.addEventListener("click",()=>openModal(products[Number(btn.dataset.index)])));
}

function openModal(p) {
  const modal=document.getElementById("modal");
  document.getElementById("modalBrand").textContent=p.brand;
  document.getElementById("modalName").textContent=p.name;
  document.getElementById("modalModel").textContent=p.color + " • " + p.model;
  document.getElementById("modalSizes").innerHTML=p.sizes.map(s=>`<span class="size">${s}</span>`).join("");
  document.getElementById("modalWhatsapp").href=waLink(p);
  document.getElementById("modalImage").innerHTML=p.image ? `<img src="${p.image}" alt="${p.name}">` : `<div class="product-placeholder"><strong>${p.brand.toUpperCase()}</strong><small>FOTO DO MODELO</small></div>`;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
}
document.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",()=>{
  document.getElementById("modal").classList.remove("show");
}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.getElementById("modal").classList.remove("show")});
document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active"); activeFilter=btn.dataset.filter; render();
}));
search.addEventListener("input",render);
render();
