"use strict";
// Contenu importé du classeur officiel fourni par MDK Import. Une fiche par page
// produit : une page peut contenir plusieurs articles/variantes.
if (Array.isArray(window.MDK_CATALOGUE) && window.MDK_CATALOGUE.length) {
  const fullCatalogue = window.MDK_CATALOGUE;
  const catalogueById = new Map(fullCatalogue.map(p => [p.id,p]));
  const imageUrl = name => 'fotos/' + encodeURIComponent(name);
  const excerpt = s => String(s||'').replace(/\s+/g,' ').slice(0,170);
  renderProducts = function () {
    const q = byId('searchInput').value.trim().toLocaleLowerCase('fr');
    const cat = byId('categoryFilter').value;
    const filtered = fullCatalogue.filter(p => (!cat || p.category===cat) && (!q || (p.name+' '+p.description+' '+categoryName(p.category)).toLocaleLowerCase('fr').includes(q)));
    byId('resultCount').textContent=filtered.length+' fiche'+(filtered.length!==1?'s':'')+' du catalogue';
    byId('productGrid').innerHTML=filtered.map(p => '<article class="product-card"><div class="product-visual mdk-photo">'+(p.images.length?'<img loading="lazy" src="'+imageUrl(p.images[0])+'" alt="'+escapeHtml(p.name)+'">':'<span aria-hidden="true">▣</span>')+'</div><div class="product-body"><small>'+escapeHtml(categoryName(p.category))+' · P. '+p.page+'</small><h3>'+escapeHtml(p.name)+'</h3><p>'+escapeHtml(excerpt(p.description))+'</p><div class="product-bottom"><span>Prix sur demande</span><button type="button" data-product="'+p.id+'">Voir le détail ↗</button></div></div></article>').join('')||'<p>Aucun produit trouvé. Essayez une autre recherche.</p>';
  };
  showProduct = function(id) {
    const p=catalogueById.get(id); if(!p)return;
    const gallery=p.images.map((img,i)=>'<img loading="lazy" src="'+imageUrl(img)+'" alt="'+escapeHtml(p.name)+' — photo '+(i+1)+'">').join('');
    const subject=encodeURIComponent('Demande de devis — '+p.name);
    const body=encodeURIComponent('Bonjour,\nJe souhaite recevoir une offre pour : '+p.name+' (catalogue page '+p.page+').\nQuantité souhaitée : \nMerci.');
    byId('dialogContent').innerHTML='<span class="dialog-tag">'+escapeHtml(categoryName(p.category))+' · Page '+p.page+'</span><h2 id="dialogTitle">'+escapeHtml(p.name)+'</h2>'+(gallery?'<div class="mdk-gallery">'+gallery+'</div>':'')+'<p class="dialog-detail">'+escapeHtml(p.description)+'</p><strong>Prix sur demande</strong><div class="dialog-actions"><a class="btn primary" href="mailto:faria@mdkimport.ch?subject='+subject+'&body='+body+'">Demander un devis ↗</a><a class="btn secondary" href="MDKimport-Catalogue-2026-2027-FR.pdf#page='+p.page+'" target="_blank" rel="noopener">Voir la page du catalogue ↗</a></div>';
    byId('productDialog').showModal();
  };
  const style=document.createElement('style');style.textContent='.product-visual.mdk-photo{background:#f5f7f2}.mdk-photo img{width:100%;height:100%;object-fit:contain;padding:14px}.mdk-gallery{display:flex;gap:12px;overflow-x:auto;margin:22px 0}.mdk-gallery img{width:160px;height:150px;object-fit:contain;background:#f5f7f2;border-radius:12px;flex:none;padding:8px}dialog{max-height:90vh;overflow:auto}.dialog-detail{white-space:pre-line;max-height:280px;overflow:auto}';document.head.appendChild(style);
  const oldNote=document.querySelector('.data-note');if(oldNote)oldNote.textContent='Fiches issues du catalogue officiel 2026–2027. Certaines pages présentent plusieurs produits ou variantes.';
  document.querySelectorAll('a[href="../MDKimport-Catalogo-FR.pdf"]').forEach(a=>a.href='MDKimport-Catalogue-2026-2027-FR.pdf');
  renderProducts();
}
