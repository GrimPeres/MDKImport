"use strict";
(function(){
 const params=new URLSearchParams(location.search);
 const id=params.get("id") || params.get("produit");
 const data=Array.isArray(window.MDK_CATALOGUE)?window.MDK_CATALOGUE:[];
 const p=data.find(item=>item.id===id);
 const target=document.getElementById("productDetail");
 const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const categories={sacs:"Sacs en plastique",films:"Films & gaines",papier:"Papier",jetables:"Consommables & jetables",sante:"Santé & protection",equipements:"Équipements"};
 const menu=document.getElementById("menuToggle"),nav=document.getElementById("navigation");
 menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});
 nav.addEventListener("click",e=>{if(e.target.closest("a")){nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}});
 document.getElementById("year").textContent=new Date().getFullYear();
 if(!p){document.title="Produit introuvable | MDK Import SA";target.innerHTML='<h1>Produit introuvable</h1><p>Cette fiche n’est pas disponible.</p><a class="btn primary" href="produits.html">Voir le catalogue ↗</a>';return}
 document.title=p.name+" | MDK Import SA";
 document.getElementById("crumbName").textContent=p.name;
 const images=Array.isArray(p.images)?p.images:[];
 const imgSrc=name=>"fotos/"+encodeURIComponent(name);
 const imageMarkup=images.length?'<div class="detail-main-photo"><img id="detailMainImage" src="'+imgSrc(images[0])+'" alt="'+safe(p.name)+'"></div>'+(images.length>1?'<div class="detail-thumbs">'+images.map((name,i)=>'<button type="button" data-img="'+i+'" aria-label="Afficher la photo '+(i+1)+'" '+(i===0?'aria-pressed="true"':'aria-pressed="false"')+'><img loading="lazy" src="'+imgSrc(name)+'" alt="'+safe(p.name)+' — photo '+(i+1)+'"></button>').join("")+'</div>':""):'<div class="detail-main-photo detail-no-photo">Photographie non disponible</div>';
 const lines=String(p.description||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const upper=String(p.name||"").trim().toLocaleUpperCase("fr");
 const cleaned=lines.filter((line,i)=>!(i<3&&line.toLocaleUpperCase("fr")===upper));
 // En-têtes issus du catalogue : on ne devine pas les colonnes si elles ne sont pas explicites.
 const headerLine=/^(ARTICLE|DIMENSION|DIMENSIONS|COULEUR|EMBALLAGE|RÉFÉRENCE|CAPACITÉ|BOÎTE|FORMAT|SOUFFLET|ÉPAISSEUR|MATIÈRE|OBSERVATIONS?|DESCRIPTION|DÉSIGNATION)(\\s|$)/i;
 const tableHeaders=/^(RÉFÉRENCE|ARTICLE|DIMENSION|DIMENSIONS|FORMAT|CAPACITÉ|BOÎTE|DÉSIGNATION)(\\s|$)/i;
 const sections=[];
 let section={title:"",rows:[]};
 for(const line of cleaned){
   if(headerLine.test(line)&&line.length<85){
     if(section.rows.length||section.title)sections.push(section);
     section={title:line,rows:[]};
   }else section.rows.push(line);
 }
 if(section.rows.length||section.title)sections.push(section);
 const specs=sections.map((group,index)=>{
   const isTable=tableHeaders.test(group.title)&&group.rows.length>=3;
   return '<section class="detail-spec-group'+(isTable?' detail-variants':'')+'">'+
    (group.title?'<h3>'+safe(group.title)+'</h3>':'')+
    (group.rows.length?'<div class="detail-spec-list">'+group.rows.map((line,i)=>
      '<div class="detail-spec-item"><span class="spec-number">'+(i+1)+'</span><span>'+safe(line)+'</span></div>').join("")+'</div>':'')+
    '</section>';
 }).join("");
 const subject=encodeURIComponent("Demande de devis — "+p.name);
 const body=encodeURIComponent("Bonjour,\nJe souhaite recevoir une offre pour : "+p.name+" (catalogue page "+p.page+").\nQuantité souhaitée : \nMerci.");
 target.innerHTML='<div class="detail-layout"><div class="detail-photos">'+imageMarkup+'</div><div class="detail-summary"><span class="eyebrow">'+safe(categories[p.category]||"Catalogue")+' · PAGE '+p.page+'</span><h1>'+safe(p.name)+'</h1><p class="detail-lead">Découvrez les caractéristiques et variantes disponibles dans notre catalogue professionnel.</p><p class="detail-price">Prix sur demande</p><div class="detail-cta"><a class="btn primary" href="mailto:faria@mdkimport.ch?subject='+subject+'&body='+body+'">Demander un devis ↗</a><a class="btn secondary" target="_blank" rel="noopener" href="MDKimport-Catalogue-2026-2027-FR.pdf#page='+p.page+'">Voir dans le catalogue ↗</a></div><p class="detail-hint">Précisez les dimensions, références et quantités souhaitées dans votre demande.</p></div></div><div class="detail-spec-section"><h2>Caractéristiques <em>et variantes.</em></h2><div class="detail-specs">'+specs+'</div></div><div class="detail-back"><a class="text-link" href="produits.html?categorie='+encodeURIComponent(p.category)+'">← Voir les autres produits de cette gamme</a></div>';
 const main=document.getElementById("detailMainImage");
 target.querySelectorAll("[data-img]").forEach(btn=>btn.addEventListener("click",()=>{
  const index=Number(btn.dataset.img);main.src=imgSrc(images[index]);main.alt=p.name+" — photo "+(index+1);
  target.querySelectorAll("[data-img]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));
 }));
})();