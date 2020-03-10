const {SEGSEP,LEVELSEP,parsesegmentid}=require("./segment");

const xrefs={};
/*TODO , build reverse xref from pts to nanchuan*/
const setupXref=(meta,rawjs)=>{
	const out={};
	let sources=[],targets=[];
	let lastbkname='',bkname='',pagenum='',lasttargetbkname='';
	let targetbkname='',targetpagenum=0;
	for (var i=0;i<rawjs.length;i++){
		line=rawjs[i];
		const at= line.indexOf('=');
		if (at>-1) {
			source=line.substr(0,at);
			target=line.substr(at+1);
		} else {
			source=line;
			target='';
			targetpagenum++;
		}

		let at2=source.indexOf(SEGSEP);
		if (at2>-1) {
			if (lastbkname) {
				out[lastbkname]=[sources,targets];
				sources=[];
				targets=[];
				lasttargetbkname='';
			}
			bkname=source.substr(0,at2);
			lastbkname=bkname;
			pagenum=source.substr(at2+1);
		} else {
			pagenum=source;
		}

		if (target){
			at2=target.indexOf(SEGSEP);
			if (at2>-1){
				targetbkname=target.substr(0,at2);
				targetpagenum=parseInt(target.substr(at2+1));
			} else {
				targetpagenum=parseInt(target);				
			}			
		}


		sources.push(pagenum);
		targets.push(targetbkname+SEGSEP+targetpagenum);
	}

	out[lastbkname]=[sources,targets];
	//console.log(out)
	//console.log(xrefofpage('16:2',out))//  map to 15:2
	if (!xrefs[meta.name]) xrefs[meta.name]={};
	xrefs[meta.name][meta.target]=out;
}

const xrefofpage=(dbname,sid)=>{
	const allxref=xrefs[dbname];
	const out={};
	if (!allxref)return null;
	for (let target in allxref){
		const xref=allxref[target];
		const o=parsesegmentid(sid);
		const bk=o[0]+o[1];
		const mapping=xref[bk];
		if (!mapping)return null;
		const sources=mapping[0],targets=mapping[1]
		const sourcepage=o[4]+LEVELSEP;
		for (var i=0;i<sources.length;i++){
			if (sources[i].substr(0,sourcepage.length)==sourcepage){
				const s=bk+SEGSEP+sources[i];
				const t=target+SEGSEP+SEGSEP+targets[i];
				if (out[s]) { //multiple xref in same line, rare
					out[s]=[out[s]];
					out[s].push(t);
				}else{
					out[s]=t
				}
			}
		}
	}
	return out;
}

module.exports={setupXref,xrefofpage}