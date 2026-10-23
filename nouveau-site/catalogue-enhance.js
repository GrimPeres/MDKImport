"use strict";
if (Array.isArray(window.MDK_CATALOGUE) && window.MDK_CATALOGUE.length) {
  const entries=window.MDK_CATALOGUE, lookup=new Map(entries.map(p=>[p.id,p]));
  const short=s=>String(s||"").replace(/\s+/g," ").slice(0,165);
  const imagePath=file=>"fotos/"+encodeURIComponent(file);
  const imageMap={
    5:["p005-1.jpg"],6:["p006-1.png","p006-2.png","p006-3.png","p006-4.png"],
    7:["p007-1.jpg","p007-2.jpg"],8:["p008-1.jpg","p008-2.png"],9:["p009-1.png"],
    10:["p010-1.jpg"],11:["p011-1.jpg"],12:["p012-1.png","p012-2.png"],
    13:["p013-1.png","p013-2.png","p013-3.jpg"],14:["p014-1.jpg"],
    16:["p016-1.jpg"],17:["p017-1.jpg"],18:["p018-1.png"],19:["p019-1.jpg"],
    20:["p020-1.png"],21:["p021-1.jpg"],29:["p029-1.png","p029-2.png","p029-3.png","p029-4.png","p029-5.png"],30:["p030-1.png"]
  };
  const photos=p=>Array.isArray(p.images)&&p.images.length?p.images:(imageMap[p.page]||[]);
  const placeholder='<span class="photo-placeholder" aria-hidden="true">▣</span>';
  const photo=(file,cls)=>'<img class="'+cls+'" src="'+imagePath(file)+'" alt="" loading="lazy" onerror="this.remove();this.parentElement.classList.add(\'image-unavailable\')">';
  let currentPage=1;
  const perPage=18;
  const controls=document.createElement("div");
  controls.className="catalogue-pagination";
  controls.setAttribute("aria-label","Pagination des produits");
  byId("productGrid").after(controls);
  renderProducts=function(){
    const q=byId("searchInput").value.trim().toLocaleLowerCase("fr"),cat=byId("categoryFilter").value;
    const shown=entries.filter(p=>(!cat||p.category===cat)&&(!q||(p.name+" "+p.description+" "+categoryName(p.category)).toLocaleLowerCase("fr").includes(q)));
    const pages=Math.max(1,Math.ceil(shown.length/perPage));currentPage=Math.min(currentPage,pages);
    const visible=shown.slice((currentPage-1)*perPage,currentPage*perPage);
    byId("resultCount").textContent=shown.length+" fiche"+(shown.length!==1?"s":"")+" du catalogue";
    byId("productGrid").innerHTML=visible.map(p=>{const pics=photos(p);return '<article class="product-card"><div class="product-visual mdk-photo">'+placeholder+(pics.length?photo(pics[0],"product-photo"):"")+'</div><div class="product-body"><small>'+escapeHtml(categoryName(p.category))+' · P. '+p.page+'</small><h3>'+escapeHtml(p.name)+'</h3><p>'+escapeHtml(short(p.description))+'</p><div class="product-bottom"><span>Prix sur demande</span><button type="button" data-product="'+escapeHtml(p.id)+'">Voir le détail ↗</button></div></div></article>'}).join("")||"<p>Aucun produit trouvé.</p>";
    controls.innerHTML=pages>1?'<button type="button" data-page="prev" '+(currentPage===1?"disabled":"")+' aria-label="Page précédente">← Précédent</button><span>Page '+currentPage+' sur '+pages+'</span><button type="button" data-page="next" '+(currentPage===pages?"disabled":"")+' aria-label="Page suivante">Suivant →</button>':"";
  };
  showProduct=function(id){
    const p=lookup.get(id);if(!p)return;
    const pics=photos(p);
    const gallery=pics.length?'<div class="product-gallery">'+pics.map((file,i)=>'<div class="gallery-image">'+photo(file,"gallery-photo")+'</div>').join("")+'</div>':"";
    const subject=encodeURIComponent("Demande de devis — "+p.name);
    const body=encodeURIComponent("Bonjour,\nJe souhaite recevoir une offre pour : "+p.name+" (catalogue page "+p.page+").\nQuantité souhaitée : \nMerci.");
    byId("dialogContent").innerHTML=gallery+'<span class="dialog-tag">'+escapeHtml(categoryName(p.category))+' · Page '+p.page+'</span><h2 id="dialogTitle">'+escapeHtml(p.name)+'</h2><p class="dialog-detail">'+escapeHtml(p.description)+'</p><strong>Prix sur demande</strong><div class="dialog-actions"><a class="btn primary" href="mailto:faria@mdkimport.ch?subject='+subject+'&body='+body+'">Demander un devis ↗</a><a class="btn secondary" href="../MDKimport-Catalogo-FR.pdf#page='+p.page+'" target="_blank" rel="noopener">Voir dans le catalogue ↗</a></div>';
    byId("productDialog").showModal();
  };
  controls.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(!b)return;currentPage+=b.dataset.page==="next"?1:-1;renderProducts();byId("produits").scrollIntoView({behavior:"smooth"})});
  byId("searchInput").addEventListener("input",()=>{currentPage=1;renderProducts()});
  byId("categoryFilter").addEventListener("change",()=>{currentPage=1;renderProducts()});
  const note=document.querySelector(".data-note");if(note)note.textContent="Fiches issues du catalogue 2026–2027. Les photographies seront affichées dès leur publication.";
  renderProducts();
}