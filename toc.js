/*
const tocNodeParser=lnk=>{
	const bookseq=parseInt(lnk);
	const at=lnk.indexOf(":");
	const paranum=parseInt(lnk.substr(at+1));
	return bookseq*65536 + bookseq;
}

*/
const MAXLINE=256,MAXPAGE=32768;
const {SEGSEP,LEVELSEP}=require("./segment")
const vplval=id=>{
	const p=id.split(SEGSEP);
	const vol=parseInt(p[0]);
	const page=parseInt(p[1]);
	let line=0;
	if (!p[1])return 0;
	let at=p[1].indexOf(LEVELSEP)
	if (at>-1) {
		line=parseInt(p[1].substr(at+1));
	}

	return line+page*MAXLINE+vol*MAXPAGE*MAXLINE;

}
const setupToc = (rawtoc)=> {
	const toc=[];
	for (let i=0;i<rawtoc.length;i++){
		const at=rawtoc[i].indexOf(",");
		const l=rawtoc[i].substr(0,at);
		let t=rawtoc[i].substr(at+2);
		if (t[0]=="|") t=t.substr(1);
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

const closestItem=(toc,tocitems,vpl,adv=0)=> {
	const v=vplval(vpl)+adv;//10 more line, to show deeper toc
	for (let i=1;i<tocitems.length;i++) {
		const tv=vplval(toc[tocitems[i]].l);
		if (tv>v) return i-1;
	}
	return tocitems.length-1;
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
const getTocAncestor=(toc,vpl)=>{
	let cur=0;
	const vplv=vplval(vpl); 
	let children=getTocChildren(toc,cur),nextchildren;
	const out=[];
	do {
		let selected = closestItem(toc,children,vpl) ;
		cur=children[selected];
		nextchildren=getTocChildren(toc,cur);
		if (children.length && out.length==0||vplv>=vplval(toc[cur].l)) {
			//label, link , first sibling, this tocseq
			const obj=Object.assign({},toc[cur]);
			obj.cur=cur;
			obj.first=children[0];
			out.push(obj)
		}
		if (!nextchildren.length) break;
		children=nextchildren;
	} while (true);
	return out;
}
module.exports={setupToc,getTocChildren,getTocAncestor,closestItem,vplval};