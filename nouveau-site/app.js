"use strict";
// Première sélection fidèle au catalogue 2026–2027. Import intégral à suivre.
const categories=[
{id:"sacs",name:"Sacs en plastique",pages:"4–39",icon:"▣"},
{id:"films",name:"Films & gaines",pages:"40–56",icon:"▤"},
{id:"papier",name:"Papier",pages:"57–81",icon:"▥"},
{id:"jetables",name:"Consommables & jetables",pages:"82–98",icon:"◫"},
{id:"sante",name:"Santé & protection",pages:"99–106",icon:"✚"},
{id:"equipements",name:"Équipements",pages:"107–108",icon:"⚙"}];
const products=[
{id:"bloc-e",name:"Bloc E",category:"sacs",page:5,description:"Sacs Bloc E — dimensions de 150 × 250 à 220 × 700."},
{id:"sac-raphia",name:"Sac raphia PP Woven",category:"sacs",page:6,description:"Modèles Fruits, Culinaire et Boules. Boîtes de 100 unités."},
{id:"sac-tnt",name:"Sac TNT réutilisable",category:"sacs",page:7,description:"Sacs TNT verts avec anse, plusieurs finitions."},
{id:"sac-vendange",name:"Sac PE vendange",category:"sacs",page:8,description:"Sacs de vendange, différentes dimensions et couleurs."},
{id:"sac-anse",name:"Sac à anse lisse",category:"sacs",page:9,description:"Sacs à anse blancs, incolores et colorés."},
{id:"sac-imprime",name:"Sac à anse imprimé",category:"sacs",page:13,description:"Sacs imprimés et travaux personnalisés, sur devis."},
{id:"sac-poubelle",name:"Rouleaux poubelle Rplastic",category:"sacs",page:21,description:"Sacs poubelle en rouleau, plusieurs capacités et couleurs."},
{id:"film-etirable",name:"Films & gaines",category:"films",page:40,description:"Découvrez les films et gaines dans le catalogue 2026–2027."},
{id:"papier-emballage",name:"Papier & emballages carton",category:"papier",page:57,description:"Boîtes, sacs papier et solutions carton."},
{id:"barquettes",name:"Consommables & jetables",category:"jetables",page:82,description:"Barquettes, gobelets et consommables professionnels."},
{id:"protection",name:"Santé & protection",category:"sante",page:99,description:"Équipements de protection et produits d’hygiène."},
{id:"equipements-pro",name:"Équipements professionnels",category:"equipements",page:107,description:"Supports et machines de charcuterie."}
];
const byId=id=>document.getElementById(id);
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pdf="../MDKimport-Catalogo-FR.pdf";
const categoryName=id=>categories.find(c=>c.id===id)?.name||"";
function renderCategories(){byId("categoryGrid").innerHTML=categories.map(c=>'<a class="category-card" href="#produits" data-category="'+c.id+'"><span class="category-icon" aria-hidden="true">'+c.icon+'</span><span><strong>'+escapeHtml(c.name)+'</strong><small>Pages '+c.pages+'</small></span><span class="category-arrow" aria-hidden="true">↗</span></a>').join("");byId("categoryFilter").insertAdjacentHTML("beforeend",categories.map(c=>'<option value="'+c.id+'">'+escapeHtml(c.name)+'</option>').join(""));byId("categoryGrid").addEventListener("click",e=>{const link=e.target.closest("[data-category]");if(link){byId("categoryFilter").value=link.dataset.category;renderProducts()}})}
function renderProducts(){const q=byId("searchInput").value.trim().toLocaleLowerCase("fr");const cat=byId("categoryFilter").value;const filtered=products.filter(p=>(!cat||p.category===cat)&&(!q||(p.name+" "+p.description+" "+categoryName(p.category)).toLocaleLowerCase("fr").includes(q)));byId("resultCount").textContent=filtered.length+" résultat"+(filtered.length!==1?"s":"");byId("productGrid").innerHTML=filtered.map(p=>'<article class="product-card"><div class="product-visual" aria-hidden="true">'+(categories.find(c=>c.id===p.category)?.icon||"□")+'</div><div class="product-body"><small>'+escapeHtml(categoryName(p.category))+' · P. '+p.page+'</small><h3>'+escapeHtml(p.name)+'</h3><p>'+escapeHtml(p.description)+'</p><div class="product-bottom"><span>Prix sur demande</span><button type="button" data-product="'+p.id+'">Voir le détail ↗</button></div></div></article>').join("")||'<p>Aucun produit trouvé. Essayez une autre recherche.</p>'}
function showProduct(id){const p=products.find(item=>item.id===id);if(!p)return;byId("dialogContent").innerHTML='<span class="dialog-tag">'+escapeHtml(categoryName(p.category))+' · Page '+p.page+'</span><h2 id="dialogTitle">'+escapeHtml(p.name)+'</h2><p class="dialog-detail">'+escapeHtml(p.description)+'</p><strong>Prix sur demande</strong><div class="dialog-actions"><a class="btn primary" href="mailto:faria@mdkimport.ch?subject='+encodeURIComponent("Demande de devis — "+p.name)+'&body='+encodeURIComponent("Bonjour,\nJe souhaite recevoir une offre pour : "+p.name+" (catalogue page "+p.page+").\nQuantité souhaitée : \nMerci.")+'">Demander un devis ↗</a><a class="btn secondary" href="'+pdf+'#page='+p.page+'" target="_blank" rel="noopener">Voir la page du catalogue ↗</a></div>';byId("productDialog").showModal()}
byId("productGrid").addEventListener("click",e=>{const btn=e.target.closest("[data-product]");if(btn)showProduct(btn.dataset.product)});
byId("dialogClose").addEventListener("click",()=>byId("productDialog").close());
byId("productDialog").addEventListener("click",e=>{if(e.target===byId("productDialog"))byId("productDialog").close()});
byId("searchInput").addEventListener("input",renderProducts);byId("categoryFilter").addEventListener("change",renderProducts);
byId("menuToggle").addEventListener("click",()=>{const nav=byId("navigation");const open=nav.classList.toggle("open");byId("menuToggle").setAttribute("aria-expanded",String(open))});byId("navigation").addEventListener("click",e=>{if(e.target.closest("a")){byId("navigation").classList.remove("open");byId("menuToggle").setAttribute("aria-expanded","false")}});
byId("year").textContent=new Date().getFullYear();renderCategories();renderProducts();