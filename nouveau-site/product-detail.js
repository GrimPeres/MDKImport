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
 // Tableaux structurés uniquement lorsque les colonnes sont identifiables sans ambiguïté.
 function structuredTable(product) {
   const rows=String(product.description||"").split(/\n+/).map(s=>s.trim()).filter(Boolean);
   // Les tableaux séparés par | conservent leurs colonnes exactes.
   const pipeGroups=[];
   let current=null;
   for(const line of rows){
     if(!line.includes("|"))continue;
     const cells=line.split("|").map(s=>s.trim());
     if(cells.length<3)continue;
     if(cells[0].toLocaleUpperCase("fr")==="RÉFÉRENCE"){
       current={columns:cells,rows:[]};
       pipeGroups.push(current);
     }else if(current&&cells.length===current.columns.length)current.rows.push(cells);
   }
   if(pipeGroups.some(group=>group.rows.length)){
     return {groups:pipeGroups.filter(group=>group.rows.length)};
   }
   if(product.page===8){
     const start=rows.findIndex(line=>line.startsWith("DIMENSION EMBALLAGE"));
     const triples=[];
     for(let i=start+2;i+2<rows.length;i+=3){
       if(!/^\d+[x×]\d+[x×][\d,]+$/i.test(rows[i]))break;
       if(!/unités/i.test(rows[i+2]))break;
       triples.push([rows[i],rows[i+1],rows[i+2]]);
     }
     if(triples.length)return {columns:["Dimension","Couleur","Emballage"],rows:triples};
   }
   if(product.page===61){
     const variants=[];
     for(const row of rows){
       const m=row.match(/^(Boîte Pizza \d+)\s+\(([^)]+)\)\s+(\d+\s+unités)$/i);
       if(m)variants.push([m[1],m[2],m[3]]);
     }
     if(variants.length)return {columns:["Article","Dimension","Pack"],rows:variants};
   }
   if(product.page===5) {
     const dims=rows.filter(s=>/^\d{2,4}\s*[x×]\s*\d{2,4}$/i.test(s));
     return dims.length?{columns:["Dimension"],rows:dims.map(s=>[s])}:null;
   }
   if(product.page===86) {
     const variants=[];
     for(const row of rows){
       const m=row.match(/^(EN\s+\S+(?:\s+(?:DIV|éco))?)\s+(\d+\s*ML)\s+(Ronde|Rectangulaire|Carrée|Ovale)\s+(.+)$/i);
       if(m)variants.push([m[1],m[2],m[3],m[4]]);
     }
     return variants.length?{columns:["Référence","Capacité","Forme","Dimension"],rows:variants}:null;
   }
   if(product.page===83){
     const variants=[];
     for(const row of rows){
       const m=row.match(/^(H-\d+)\s+-\s+(.+?)\s+(\d+[x×]\d+[x×]\d+)\s+(\d+\s+unités)$/i);
       if(m)variants.push([m[1],m[2],m[3],m[4]]);
     }
     return variants.length?{columns:["Référence","Article","Dimension","Pack"],rows:variants}:null;
   }
   return null;
 }
 const structured=structuredTable(p);
 const tableGroups=structured?(structured.groups||[structured]):[];
 const tableMarkup=tableGroups.map((group,index)=>
   '<div class="detail-table-wrap"><table class="detail-variant-table"><thead><tr>'+
   group.columns.map(x=>'<th scope="col">'+safe(x)+'</th>').join("")+'</tr></thead><tbody>'+
   group.rows.map(row=>'<tr>'+row.map(value=>'<td>'+safe(value)+'</td>').join("")+'</tr>').join("")+
   '</tbody></table></div>').join("")+
   (structured?'<p class="detail-source-note">Données reprises du catalogue officiel. Consultez les caractéristiques complètes ci-dessous.</p>':"");

 const subject=encodeURIComponent("Demande de devis — "+p.name);
 const body=encodeURIComponent("Bonjour,\nJe souhaite recevoir une offre pour : "+p.name+" (catalogue page "+p.page+").\nQuantité souhaitée : \nMerci.");
 target.innerHTML='<div class="detail-layout"><div class="detail-photos">'+imageMarkup+'</div><div class="detail-summary"><span class="eyebrow">'+safe(categories[p.category]||"Catalogue")+' · PAGE '+p.page+'</span><h1>'+safe(p.name)+'</h1><p class="detail-lead">Découvrez les caractéristiques et variantes disponibles dans notre catalogue professionnel.</p><p class="detail-price">Prix sur demande</p><div class="detail-cta"><button type="button" class="btn primary" data-add-devis="'+safe(p.id)+'">+ Ajouter à ma demande</button><a class="detail-catalogue-link" target="_blank" rel="noopener" href="MDKimport-Catalogue-2026-2027-FR.pdf#page='+p.page+'">Consulter la page du catalogue ↗</a></div><p class="devis-feedback" id="devisFeedback" hidden></p><p class="detail-hint">Précisez les dimensions, références et quantités souhaitées dans votre demande.</p></div></div><div class="detail-spec-section"><h2>Caractéristiques <em>et variantes.</em></h2>'+tableMarkup+'<details class="detail-raw-specs" '+(structured?"":"open")+'><summary>Informations complètes du catalogue</summary><div class="detail-specs">'+specs+'</div></details></div><div class="detail-back"><a class="text-link" href="produits.html?categorie='+encodeURIComponent(p.category)+'">← Voir les autres produits de cette gamme</a></div>';
 const main=document.getElementById("detailMainImage");
 target.querySelectorAll("[data-img]").forEach(btn=>btn.addEventListener("click",()=>{
  const index=Number(btn.dataset.img);main.src=imgSrc(images[index]);main.alt=p.name+" — photo "+(index+1);
  target.querySelectorAll("[data-img]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));
 }));
})();