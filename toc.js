const setupToc = rawtoc=> {
	const toc=[];
	for (let i=0;i<rawtoc.length;i++){
		const at=rawtoc[i].indexOf(",");
		const l=rawtoc[i].substr(0,at);
		const t=rawtoc[i].substr(at+2);
		const d=parseInt('0x'+rawtoc[i].substr(at+1,1));
		toc.push({ d,t,l } );
	}
	if (!toc || !toc.length || toc.built) return;
	var depths=[];
 	var prev=0,j=0;
 	for (var i=0;i<toc.length;i++) if (toc[i].n) delete toc[i].n;
	for (var i=0;i<toc.length;i++) {

	    var depth=toc[i].d;
	    if (prev>depth) { //link to prev sibling
	      if (depths[depth]) toc[depths[depth]].n = i;
	      for (j=depth;j<prev;j++) depths[j]=0;
	    }
    	depths[depth]=i;
    	prev=depth;
	}
	toc.built=true;
	return toc;
}
const getTocChildren = (toc,n)=> {
	if (!toc[n]||!toc[n+1] ||toc[n+1].d!==toc[n].d+1) return [];
	var out=[],next=n+1;

	while (next) {
		out.push(next);
		if (!toc[next+1])break;
		if (toc[next].d==toc[next+1].d) {
			next++;
		} else if (toc[next].n){
			next=toc[next].n;			
		} else {
			next=0;
		}
	}
	return out;
}
module.exports={setupToc,getTocChildren};