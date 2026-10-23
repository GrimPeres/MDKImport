"use strict";
// Sélection éditoriale variée : ne représente pas un classement de ventes.
(function(){
 const ids=["page-6","page-47","page-61","page-86","page-100","page-108"];
 const catalogue=Array.isArray(window.MDK_CATALOGUE)?window.MDK_CATALOGUE:[];
 const map=new Map(catalogue.map(p=>[p.id,p]));
 const names={sacs:"Sacs en plastique",films:"Films & gaines",papier:"Papier",jetables:"Consommables & jetables",sante:"Santé & protection",equipements:"Équipements"};
 const safe=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const grid=document.getElementById("featuredGrid");
 if(!grid)return;
 grid.innerHTML=ids.map(id=>{
   const p=map.get(id);if(!p)return "";
   const img=p.images?.[0];
   const image=img?'<img loading="lazy" src="fotos/'+encodeURIComponent(img)+'" alt="'+safe(p.name)+'">':'<span aria-hidden="true">▣</span>';
   return '<article class="product-card featured-product"><a class="featured-card-link" href="produit.html?id='+encodeURIComponent(p.id)+'" aria-label="Voir '+safe(p.name)+'"><div class="product-visual mdk-photo">'+image+'</div><div class="product-body"><small>'+safe(names[p.category]||"Catalogue")+'</small><h3>'+safe(p.name)+'</h3><p>'+safe(String(p.description||"").replace(/\\s+/g," ").slice(0,125))+'</p></div></a><div class="featured-card-footer"><span>Prix sur demande</span><button class="catalogue-add" type="button" data-add-devis="'+safe(p.id)+'">+ Ajouter à ma demande</button></div></article>';
 }).join("");
})();