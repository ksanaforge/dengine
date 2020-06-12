const addlink=function(links,fromdb,regex){
	//[hyperlink, target_vpl ]
	const backlinks=this;
	const hyperlink_regex=/^(.+?)_(\d+)$/
	for (var i=0;i<links.length;i++){
		const m=links[i][0].match(hyperlink_regex);
		const bk=m[1],para=m[2];

		if (!backlinks[bk]) {
			backlinks[bk]={};
		}
		if (!backlinks[bk][para]) {
			backlinks[bk][para]={};
		}
		if (!backlinks[bk][para][fromdb]){
			backlinks[bk][para][fromdb]=[];	
		}
		backlinks[bk][para][fromdb].push(links[i][1]);
	}
}
const findbacklinks=(backlinks,sid)=>{
	const hyperlink_regex=/^(.+?)_(\d+)$/
	const m=sid.match(hyperlink_regex);
	if (!m)return null;

	const bk=m[1],para=m[2];
	if (!backlinks[bk])return null;
	if (!backlinks[bk][para])return null;
	const linkobj=backlinks[bk][para];
	let out=[];
	for (let tdb in linkobj) {
		const arr=linkobj[tdb].map( link=>[tdb,link]);
		out=out.concat(arr);
	}
	return out;
}

module.exports={addlink,findbacklinks};