const makelinklist=bklinks=>{
	const out=[];
	for (bk in bklinks) {
		const arr=bklinks[bk];
		for (var i=0;i<arr.length;i++) {
			const m=arr[i].match(/(.+?)\|(\d+)/)
			out.push( [bk+"_"+m[2] , m[1] ]);
		}
	}
	return out;
}
const buildbacklink=(dbname,dbpool)=>{
	const sourcedb=dbpool[dbname];
	if (!sourcedb.extra)return;
	const matlinks=sourcedb.extra.matlinks;
	if (!matlinks)return;

	for (targetdb in matlinks) {
		const tdb=dbpool[targetdb];
		if (tdb){
			const bklinks=matlinks[targetdb];
			if (bklinks){
				const mlinks=makelinklist(bklinks);
				tdb.addlink(mlinks,dbname);
				delete matlinks[targetdb];
			}
			// mul link to att is handled later when att is opened
			buildbacklink(targetdb,dbpool);
		}
	}
}
module.exports={buildbacklink};