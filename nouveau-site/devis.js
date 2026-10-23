"use strict";
(function(){
 const key="mdk-devis-v1";
 const catalogue=Array.isArray(window.MDK_CATALOGUE)?window.MDK_CATALOGUE:[];
 const lookup=new Map(catalogue.map(p=>[p.id,p]));
 const variantGroups=id=>{
   const groups=window.MDK_PDF_TABLES?.[id];
   if(!Array.isArray(groups))return [];
   return groups.map(g=>({title:String(g.title||"Variantes"),options:(g.rows||[]).map(row=>(Array.isArray(row)?row:[]).map((value,i)=>{
     const v=String(value??"").trim();
     if(!v)return "";
     const heading=String(g.columns?.[i]||"").trim();
     return heading?heading+": "+v:v;
   }).filter(Boolean).join(" · ")).filter(Boolean)})).filter(g=>g.options.length);
 };
 const variantOptions=id=>[...new Set(variantGroups(id).flatMap(g=>g.options))];
 const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const read=()=>{try{const data=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(data)?data.filter(x=>lookup.has(x.id)).slice(0,100):[]}catch{return []}};
 const write=items=>{try{localStorage.setItem(key,JSON.stringify(items))}catch{};updateCount();window.dispatchEvent(new Event("mdk-devis-change"))};
 function updateCount(){document.querySelectorAll("[data-devis-count]").forEach(el=>el.textContent=String(read().length))}
 function add(id){
   if(!lookup.has(id))return false;
   const items=read();
   if(!items.some(x=>x.id===id)){items.push({id,quantity:"",variant:""});write(items)}
   else updateCount();
   return true;
 }
 function set(id,field,value){const items=read();const item=items.find(x=>x.id===id);if(item){item[field]=String(value).slice(0,800);write(items)}}
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
     return '<article class="devis-item" data-item="'+safe(x.id)+'"><div class="devis-photo">'+image+'</div><div class="devis-fields"><h3><a href="produit.html?id='+encodeURIComponent(x.id)+'">'+safe(p.name)+'</a></h3><small>Catalogue · Page '+p.page+'</small><div class="devis-field-grid"><label>Quantité souhaitée<input data-field="quantity" type="text" maxlength="100" placeholder="Ex. 100 unités" value="'+safe(x.quantity)+'"></label><label>Variante / dimension / référence'+(variantOptions(x.id).length?'<select data-field="variant"><option value="">Choisir une variante…</option>'+variantGroups(x.id).map(g=>'<optgroup label="'+safe(g.title)+'">'+g.options.map(v=>'<option value="'+safe(v)+'" '+(x.variant===v?'selected':'')+'>'+safe(v)+'</option>').join("")+'</optgroup>').join("")+'<option value="__other__" '+(x.variant&& !variantOptions(x.id).includes(x.variant)?'selected':'')+'>Autre / à préciser</option></select><input class="devis-other-variant" data-field="variant-custom" maxlength="300" placeholder="Précisez votre variante" value="'+safe(variantOptions(x.id).includes(x.variant)?'':x.variant)+'" '+(x.variant&&!variantOptions(x.id).includes(x.variant)?'':'hidden')+'>':'<input data-field="variant" type="text" maxlength="300" placeholder="Précisez la référence ou la dimension" value="'+safe(x.variant)+'">')+'</label></div></div><button type="button" class="devis-remove" data-remove="'+safe(x.id)+'" aria-label="Retirer '+safe(p.name)+'">Retirer ×</button></article>';
   }).join("");
   document.getElementById("devisTotal").textContent=items.length+" produit"+(items.length!==1?"s":"")+" sélectionné"+(items.length!==1?"s":"");
 }
 document.addEventListener("click",e=>{
   const btn=e.target.closest("[data-add-devis]");
   if(btn){if(add(btn.dataset.addDevis)){btn.textContent="✓ Ajouté à ma demande";btn.classList.add("added");const msg=document.getElementById("devisFeedback");if(msg){msg.hidden=false;msg.textContent="Produit ajouté. Vous pouvez continuer votre sélection ou consulter votre demande."}}}
   const del=e.target.closest("[data-remove]");
   if(del){remove(del.dataset.remove);render()}
 });
 document.addEventListener("input",e=>{
   const field=e.target.closest("[data-field]");
   if(field){const item=field.closest("[data-item]");if(!item)return;
     if(field.dataset.field==="variant"){
       const custom=item.querySelector("[data-field=variant-custom]");
       if(custom){custom.hidden=field.value!=="__other__";if(field.value==="__other__"){set(item.dataset.item,"variant",custom.value);return}}
     }
     set(item.dataset.item,field.dataset.field==="variant-custom"?"variant":field.dataset.field,field.value);
   }
 });
 window.addEventListener("mdk-devis-change",updateCount);
 if(document.getElementById("devisItems")){
   render();
   document.getElementById("devisForm").addEventListener("submit",e=>{
     e.preventDefault();
     const items=read();if(!items.length)return;
     const subject="Demande de devis — MDK Import — "+items.length+" produit"+(items.length>1?"s":"");
     const lines=["Bonjour,","","Je souhaite recevoir une offre pour les produits suivants :",""];
     items.forEach((item,i)=>{const p=lookup.get(item.id);lines.push((i+1)+". "+p.name+" (catalogue p. "+p.page+")","Quantité : "+(item.quantity.trim()||"À préciser"),"Variante / référence : "+(item.variant.trim()||"À préciser"),"")});
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