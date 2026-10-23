"use strict";
// Catalogue officiel MDK Import 2026–2027 : une fiche par page de produits.
if (Array.isArray(window.MDK_CATALOGUE) && window.MDK_CATALOGUE.length) {
  const all = window.MDK_CATALOGUE;
  const lookup = new Map(all.map(p => [p.id,p]));
  const imageUrl = name => "fotos/" + encodeURIComponent(name);
  const excerpt = s => String(s || "").replace(/\s+/g, " ").trim().slice(0,150);
  const images = p => Array.isArray(p.images) ? p.images : [];
  const countByCategory = id => all.filter(p => p.category === id).length;
  const pageSize = 18;
  let page = 1;
  const pagination = document.createElement("nav");
  pagination.className = "catalogue-pagination";
  pagination.setAttribute("aria-label", "Pagination du catalogue");
  byId("productGrid").after(pagination);

  // Respecte le contenu du catalogue, tout en éliminant les en-têtes répétés.
  function formatDescription(raw, product) {
    const lines = String(raw || "").split(/\\n+/).map(s => s.trim()).filter(Boolean);
    const title = String(product.name || "").trim().toLocaleUpperCase("fr");
    const categoryHeaders = new Set(["SACS EN PLASTIQUE", "FILMS", "& GAINES", "PAPIER",
      "CONSOMMABLES", "& JETABLES", "SANTÉ", "& PROTECTION", "ÉQUIPEMENTS"]);
    const headings = /^(ARTICLE|DIMENSION|DIMENSIONS|COULEUR|EMBALLAGE|RÉFÉRENCE|CAPACITÉ|BOÎTE|FORMAT|SOUFFLET|ÉPAISSEUR|MATIÈRE|OBSERVATIONS?|DESCRIPTION|DÉSIGNATION)(\\s|$)/i;
    const filtered = lines.filter((line, i) => {
      const upper = line.toLocaleUpperCase("fr");
      if (i < 3 && (upper === title || categoryHeaders.has(upper))) return false;
      return i === 0 || line !== lines[i - 1];
    });
    const max = 240;
    return filtered.slice(0,max).map(line => {
      const heading = headings.test(line) && line.length < 75;
      return '<div class="spec-row' + (heading ? ' spec-row-heading' : '') + '">' +
        escapeHtml(line) + '</div>';
    }).join("") + (filtered.length > max ? '<p class="spec-truncated">Voir le catalogue PDF pour la liste complète.</p>' : "");
  }

  function renderCategoriesCount() {
    document.querySelectorAll(".category-card").forEach(card => {
      const id = card.dataset.category;
      const small = card.querySelector("small");
      if (small && id) small.textContent = countByCategory(id) + " fiches · " + (categories.find(c => c.id === id)?.pages || "");
    });
    byId("categoryFilter").querySelectorAll("option").forEach(option => {
      if (option.value) option.textContent = categoryName(option.value) + " (" + countByCategory(option.value) + ")";
    });
  }

  renderProducts = function () {
    const q = byId("searchInput").value.trim().toLocaleLowerCase("fr");
    const cat = byId("categoryFilter").value;
    const filtered = all.filter(p => (!cat || p.category === cat) &&
      (!q || (p.name + " " + p.description + " " + categoryName(p.category)).toLocaleLowerCase("fr").includes(q)));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(Math.max(page, 1), totalPages);
    const visible = filtered.slice((page-1)*pageSize, page*pageSize);
    byId("resultCount").textContent = filtered.length + " fiche" + (filtered.length !== 1 ? "s" : "") +
      (cat ? " · " + categoryName(cat) : " · Toutes les catégories");
    byId("productGrid").innerHTML = visible.map(p => {
      const pics = images(p);
      const visual = pics.length
        ? '<img loading="lazy" src="' + imageUrl(pics[0]) + '" alt="' + escapeHtml(p.name) + '" onerror="this.replaceWith(document.createTextNode(\'▣\'))">'
        : '<span class="catalogue-photo-missing" aria-label="Photographie non disponible"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></svg><span>Photographie<br>non disponible</span></span>';
      return '<article class="product-card catalogue-card"><a class="catalogue-card-link" href="produit.html?id=' + encodeURIComponent(p.id) + '"><div class="product-visual mdk-photo">' + visual +
        '</div><div class="product-body"><small>' + escapeHtml(categoryName(p.category)) + ' · P. ' + p.page +
        '</small><h3>' + escapeHtml(p.name) + '</h3><p>' + escapeHtml(excerpt(p.description)) +
        '</p><div class="product-bottom"><span>Prix sur demande</span><strong class="catalogue-view-label">Voir la fiche ↗</strong></div></div></a></article>';
    }).join("") || '<p class="no-results">Aucun produit trouvé. Essayez une autre recherche.</p>';
    pagination.innerHTML = totalPages > 1
      ? '<button type="button" data-move="-1" ' + (page===1 ? "disabled" : "") +
        '>← Précédent</button><span>Page ' + page + ' / ' + totalPages +
        '</span><button type="button" data-move="1" ' + (page===totalPages ? "disabled" : "") +
        '>Suivant →</button>' : "";
  };

  showProduct = function (id) {
    const p = lookup.get(id);
    if (!p) return;
    const gallery = images(p).map((name,i) =>
      '<img loading="lazy" src="' + imageUrl(name) + '" alt="' + escapeHtml(p.name) + ' — photo ' + (i+1) + '">').join("");
    const subject = encodeURIComponent("Demande de devis — " + p.name);
    const body = encodeURIComponent("Bonjour,\nJe souhaite recevoir une offre pour : " + p.name +
      " (catalogue page " + p.page + ").\nQuantité souhaitée : \nMerci.");
    byId("dialogContent").innerHTML =
      '<span class="dialog-tag">' + escapeHtml(categoryName(p.category)) + ' · Page ' + p.page + '</span>' +
      '<h2 id="dialogTitle">' + escapeHtml(p.name) + '</h2>' +
      (gallery ? '<div class="mdk-gallery">' + gallery + '</div>' : "") +
      '<div class="specs-heading">Caractéristiques et variantes</div>' +
      '<div class="mdk-specs">' + formatDescription(p.description, p) + '</div>' +
      '<strong class="price-label">Prix sur demande</strong>' +
      '<div class="dialog-actions"><a class="btn primary" href="mailto:faria@mdkimport.ch?subject=' + subject +
      '&body=' + body + '">Demander un devis ↗</a>' +
      '<a class="btn secondary" href="MDKimport-Catalogue-2026-2027-FR.pdf#page=' + p.page +
      '" target="_blank" rel="noopener">Voir dans le catalogue ↗</a></div>';
    byId("productDialog").showModal();
  };

  pagination.addEventListener("click", e => {
    const btn = e.target.closest("[data-move]");
    if (!btn || btn.disabled) return;
    page += Number(btn.dataset.move);
    renderProducts();
    byId("produits").scrollIntoView({behavior:"smooth"});
  });
  byId("searchInput").addEventListener("input", () => {page=1;renderProducts()});
  byId("categoryFilter").addEventListener("change", () => {page=1;renderProducts()});
  byId("categoryGrid").addEventListener("click", e => {
    if (e.target.closest("[data-category]")) {page=1;setTimeout(renderProducts,0)}
  });
  const note = document.querySelector(".data-note");
  if (note) note.textContent = "Catalogue 2026–2027 · Une fiche peut présenter plusieurs produits ou variantes.";
  renderCategoriesCount();
  renderProducts();
}
