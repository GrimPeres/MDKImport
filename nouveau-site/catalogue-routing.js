"use strict";
(function(){
 const params=new URLSearchParams(location.search);
 const category=params.get("categorie");
 const search=params.get("q");
 const select=document.getElementById("categoryFilter");
 const input=document.getElementById("searchInput");
 if(category && select && Array.from(select.options).some(o=>o.value===category)){select.value=category;select.dispatchEvent(new Event("change"))}
 if(search && input){input.value=search;input.dispatchEvent(new Event("input"))}
})();