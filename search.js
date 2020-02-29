'use strict';
const {TOKEN_CHARS}=require("./tokenizer");
let parseTofind=(tofind)=>{
	tofind=tofind.trim();
	if (tofind.length==0) return [];
	const rawterms=tofind.split(/ +/);
	let out=[];
	for (let i=0;i<rawterms.length;i++){
		const newobj={};

		let t=rawterms[i];
		t=t.replace(/^\$+/g,"");
		if (!t.length)continue;
		newobj.raw=t;

		let renderexp,rt=t.replace("$","");
		if (t.charAt(0)=='?') {
			rt=t=t.substr(1);
			renderexp=fuzzilize(rt);
		} else {
			renderexp=fuzzilize(rt,"[^"+TOKEN_CHARS+"]"); //每一筆前面要補空白，否則塗不到
			t="^"+t;
		}

		newobj.term=t;
		newobj.regex=fuzzilize(t);
		newobj.renderexp=renderexp;
		out.push(newobj);
	}
	return out;
}
const paliexpand=[
	[/a/ig,"[aā]"],
	[/i/ig,"[iī]"],
	[/u/ig,"[uū]"],
	[/n/ig,"[nñṅṇŋ]"],
	[/m/ig,"[mṁṃ]"],
	[/d/ig,"[dḍ]"],
	[/t/ig,"[tṭ]"],
	[/l/ig,"[lḷ]"]
]

const fuzzilize=(token,prefix)=>{
	var o=token;
	prefix=prefix||"";
	for (var item of paliexpand){
		o=o.replace(item[0],item[1]);
	}
	return new RegExp(prefix+o,"ig");
}
let simplerank=(db,field,tokenpostings,opts)=>{
	const dochits={},freq={};
	const combinepostings=postings=>{
		let out=[];
		postings.forEach( p=>out=out.concat(p));
		return out.sort();
	}
	const postings=[];
	for (var term in tokenpostings){
		postings.push(combinepostings(tokenpostings[term].map(item=>item[1]) ));
	}
	
	for (let i=0;i<postings.length;i++) {
		let posting=postings[i],ndoc=0;

		for (let j=0;j<posting.length;j++){
			if (!dochits[posting[j]]) {
				dochits[posting[j]]=[];
				ndoc++;
			}
			dochits[posting[j]].push(i);
		}
		freq[i]={termfreq:posting.length,docfreq:ndoc};
	}

	const out=[];

	let averagelength=db.averagelength(field) ;

	for (let doc in dochits){
		const hits=dochits[doc];
		const n=parseInt(doc);

		let score=0,lastdoc=-1;
		for (let i=0;i<hits.length;i++){
			if (hits[i]!==lastdoc){
				score+=5;
			} else {
				score*=1.05;
			}
			lastdoc=hits[i];
		}

		const doclen=db.getdoclen(field,n);
		let t=(doclen/averagelength);
		t=1/Math.sqrt(t);
		score *= t;
		if (opts.searchrange){
			if (n>=opts.searchrange[0]&&n<=opts.searchrange[1])	out.push([n,score]);
		} else {
			out.push([n,score]);
		}
	}
	out.sort((a,b)=>b[1]-a[1]);

	return out;
}
module.exports={ simplerank ,parseTofind}