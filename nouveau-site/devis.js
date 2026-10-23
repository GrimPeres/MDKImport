"use strict";
(function(){
 const key="mdk-devis-v1";
 const catalogue=Array.isArray(window.MDK_CATALOGUE)?window.MDK_CATALOGUE:[];
 const lookup=new Map(catalogue.map(p=>[p.id,p]));
 const variantGroups=id=>{
   const groups=window.MDK_PDF_TABLES?.[id];
   if(!Array.isArray(groups))return [];
   // Products named after a single family on a mixed catalogue page must not
   // offer unrelated articles. Other pages intentionally represent full ranges.
   const scoped=groups;
   return scoped.map(g=>({title:String(g.title||"Variantes"),options:(g.rows||[]).flatMap(row=>{
     if(!Array.isArray(row))return [];
     // Page 26: preserve grouped colours in the catalogue table, but offer
     // a separate selectable quote variant for each listed colour.
     const colourIndex=["page-26","page-66","page-67","page-68"].includes(id)?g.columns?.findIndex(c=>/couleur|papier/i.test(c)):-1;
     const colour=colourIndex>=0?String(row[colourIndex]||""):"";
     const colours=colour.includes("/")?colour.split("/").map(c=>c.trim()).filter(Boolean):[colour];
     const packageIndex=id==="page-78"?g.columns?.findIndex(c=>/boîte/i.test(c)):-1;
     const pack=packageIndex>=0?String(row[packageIndex]||""):"";
     const packs=pack.includes(" ou ")?pack.split(/\\s+ou\\s+/i).map(c=>c.trim()).filter(Boolean):[pack];
     return colours.flatMap(singleColour=>packs.map(singlePack=>row.map((value,i)=>{
       const v=String(i===colourIndex?singleColour:i===packageIndex?singlePack:value??"").trim();
       if(!v)return "";
       const heading=String(g.columns?.[i]||"").trim();
       return heading?heading+": "+v:v;
     }).filter(Boolean).join(" · ")));
   }).filter(Boolean)})).filter(g=>g.options.length);
 };
 const variantOptions=id=>[...new Set(variantGroups(id).flatMap(g=>g.options))];
 const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const read=()=>{try{const data=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(data)?data.filter(x=>lookup.has(x.id)).slice(0,100).map(x=>({...x,variants:Array.isArray(x.variants)&&x.variants.length?x.variants:[{variant:variantOptions(x.id).includes(x.variant)?x.variant:"",quantity:x.quantity||""}]})):[]}catch{return []}};
 const write=items=>{try{localStorage.setItem(key,JSON.stringify(items))}catch{};updateCount();window.dispatchEvent(new Event("mdk-devis-change"))};
 function updateCount(){document.querySelectorAll("[data-devis-count]").forEach(el=>el.textContent=String(read().length))}
 function add(id){
   if(!lookup.has(id))return false;
   const items=read();
   if(!items.some(x=>x.id===id)){items.push({id,quantity:"",variant:""});write(items)}
   else updateCount();
   return true;
 }
 function set(id,index,field,value){const items=read();const item=items.find(x=>x.id===id);if(item&&item.variants[index]){item.variants[index][field]=String(value).slice(0,800);write(items)}}
 function addVariant(id){const items=read(),item=items.find(x=>x.id===id);if(item&&item.variants.length<30){item.variants.push({variant:"",quantity:""});write(items);render()}}
 function removeVariant(id,index){const items=read(),item=items.find(x=>x.id===id);if(item&&item.variants.length>1){item.variants.splice(index,1);write(items);render()}}
 function remove(id){write(read().filter(x=>x.id!==id))}
 function render(){
   const target=document.getElementById("devisItems");if(!target)return;
   const items=read();
   const empty=document.getElementById("devisEmpty");
   const form=document.getElementById("devisForm");
   empty.hidden=items.length>0;form.hidden=items.length===0;
   target.innerHTML=items.map(x=>{
     const p=lookup.get(x.id);
     const image=p.images?.[0]?'<img loading="lazy" src="fotos/'+encodeURIComponent(p.images[0])+'" alt="'+safe(p.name)+'">':"";
     const groups=variantGroups(x.id),hasVariants=variantOptions(x.id).length>0;
     const rows=x.variants.map((v,i)=>'<div class="devis-variant-row" data-variant-index="'+i+'"><div class="devis-field-grid"><label>Quantité souhaitée<input data-field="quantity" type="text" maxlength="100" placeholder="Ex. 100 unités" value="'+safe(v.quantity)+'"></label><label>Variante / dimension / référence'+(hasVariants?'<select data-field="variant" required><option value="">Choisir une variante…</option>'+groups.map(g=>'<optgroup label="'+safe(g.title)+'">'+g.options.map(option=>'<option value="'+safe(option)+'" '+(v.variant===option?'selected':'')+'>'+safe(option)+'</option>').join("")+'</optgroup>').join("")+'</select>':'<span class="devis-no-variant">Variantes à confirmer auprès de MDK Import</span>')+'</label></div>'+(x.variants.length>1?'<button type="button" class="devis-remove-variant" data-remove-variant="'+i+'">Retirer cette variante ×</button>':'')+'</div>').join("");
     return '<article class="devis-item" data-item="'+safe(x.id)+'"><div class="devis-photo">'+image+'</div><div class="devis-fields"><h3><a href="produit.html?id='+encodeURIComponent(x.id)+'">'+safe(p.name)+'</a></h3><small>Catalogue · Page '+p.page+'</small><div class="devis-variant-rows">'+rows+'</div>'+(hasVariants?'<button type="button" class="devis-add-variant" data-add-variant="'+safe(x.id)+'">+ Ajouter une autre variante</button>':'')+'</div><button type="button" class="devis-remove" data-remove="'+safe(x.id)+'" aria-label="Retirer '+safe(p.name)+'">Retirer ×</button></article>';
   }).join("");
   document.getElementById("devisTotal").textContent=items.length+" produit"+(items.length!==1?"s":"")+" sélectionné"+(items.length!==1?"s":"");
 }
 document.addEventListener("click",e=>{
   const btn=e.target.closest("[data-add-devis]");
   if(btn){if(add(btn.dataset.addDevis)){btn.textContent="✓ Ajouté à ma demande";btn.classList.add("added");const msg=document.getElementById("devisFeedback");if(msg){msg.hidden=false;msg.textContent="Produit ajouté. Vous pouvez continuer votre sélection ou consulter votre demande."}}}
   const plus=e.target.closest("[data-add-variant]");if(plus)addVariant(plus.dataset.addVariant);
   const minus=e.target.closest("[data-remove-variant]");if(minus){const item=minus.closest("[data-item]");if(item)removeVariant(item.dataset.item,Number(minus.dataset.removeVariant))}
   const del=e.target.closest("[data-remove]");
   if(del){remove(del.dataset.remove);render()}
 });
 document.addEventListener("change",e=>{if(e.target.matches("select[data-field]")){const field=e.target,item=field.closest("[data-item]");if(item)set(item.dataset.item,Number(field.closest("[data-variant-index]").dataset.variantIndex),"variant",field.value)}});
 document.addEventListener("input",e=>{
   const field=e.target.closest("[data-field]");
   if(field){const item=field.closest("[data-item]");if(!item)return;
     set(item.dataset.item,Number(field.closest("[data-variant-index]").dataset.variantIndex),field.dataset.field,field.value);
   }
 });
 window.addEventListener("mdk-devis-change",updateCount);
 if(document.getElementById("devisItems")){
   render();
   document.getElementById("devisForm").addEventListener("submit",e=>{
     e.preventDefault();
     const items=read();if(!items.length)return;
     const missing=items.find(item=>variantOptions(item.id).length&&item.variants.some(v=>!v.variant));if(missing){const select=[...document.querySelectorAll('[data-item="'+missing.id+'"] [data-field="variant"]')].find(el=>!el.value);if(select){select.focus();select.reportValidity()}return;}
     const subject="Demande de devis — MDK Import — "+items.length+" produit"+(items.length>1?"s":"");
     const lines=["Bonjour,","","Je souhaite recevoir une offre pour les produits suivants :",""];
     items.forEach((item,i)=>{const p=lookup.get(item.id);lines.push((i+1)+". "+p.name+" (catalogue p. "+p.page+")");item.variants.forEach((v,j)=>{lines.push("  Variante "+(j+1)+" : "+(v.variant.trim()||"Non spécifiée dans le catalogue"),"  Quantité : "+(v.quantity.trim()||"À préciser"))});lines.push("")});
     const name=document.getElementById("devisName").value.trim();
     const company=document.getElementById("devisCompany").value.trim();
     const contact=document.getElementById("devisContact").value.trim();
     const notes=document.getElementById("devisNotes").value.trim();
     if(notes)lines.push("Informations complémentaires :",notes,"");
     if(name||company||contact)lines.push("Coordonnées :",name,company,contact,"");
     lines.push("Merci de me communiquer votre offre.","","Cordialement,");
     const url="mailto:faria@mdkimport.ch?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(lines.join("\n"));
     if(url.length>1900){const warning=document.getElementById("devisWarning");warning.hidden=false;warning.textContent="Votre demande est longue. Certains logiciels de messagerie peuvent tronquer le contenu. Réduisez les notes ou répartissez la demande en plusieurs emails."}
     window.location.href=url;
   });
 }
 updateCount();
 window.MDKDevis={add,read};
})();