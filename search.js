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
let intersection=(arr1,arr2)=>{

}
let weightrank=(db,field,tokenpostings,opts)=>{
	const scores={};
	for (let term in tokenpostings){
		const subterm=tokenpostings[term];
		for (let i in subterm){
			let weight=db.termweight(subterm[i][0],field);
			if (weight>3) weight=3;
			const postings=subterm[i][1];
			let lastdoc=0,w=weight;
			for (let j=0;j<postings.length;j++){
				const doc=postings[j];
				if (!scores[doc]) scores[doc]=1;
				w=(lastdoc==doc)?w*0.5:weight;
				scores[doc]+=w;
				lastdoc=doc;
			}
		}
	}
	const out=[];
	for (let doc in scores){
		const score=scores[doc];
		if (opts.searchrange){
			if (doc>=opts.searchrange[0]&&n<=opts.searchrange[1])	out.push([doc,score]);
		} else {
			out.push([doc,score]);
		}
	}

	if (opts.exclude){
		const binfo=db.findbook(opts.exclude);
		if (binfo.range){
			let s=binfo.range[0],e=binfo.range[1];
			out=out.filter( item=> item[0]<s || item[0]>e )
		}
	}
	out.sort((a,b)=>b[1]-a[1]);
	return out;
}
let simplerank=(db,field,tokenpostings,opts)=>{
	const dochits={},freq={};
	const combinepostings=postings=>{
		let out=[];
		for (var i=0;i<postings.length;i++){
			out=out.concat(postings[i]);
		};
		out.sort( (a,b)=>a-b );
		return out;
	}
	const postings=[] , termweights=[];
	for (var term in tokenpostings){
		postings.push(combinepostings(tokenpostings[term].map(item=>item[1]) ));
		//termweights.push( db.termweight(term,field));
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

	let out=[];
	let averagelength=db.averagelength(field) ;
	for (let doc in dochits){
		const hits=dochits[doc];
		const n=parseInt(doc);

		let score=1,lastterm=-1;
		for (let i=0;i<hits.length;i++){
			if (hits[i]!==lastterm){
				score*=10; //termweights[ hits[i] ];
			} else {
				score*=1.05;
			}
			lastterm=hits[i];
		}

		/*
		const doclen=db.getdoclen(field,n);
		let t=(doclen/averagelength);
		t=1/Math.sqrt(t);
		score *= t;
		*/
		if (opts.searchrange){
			if (n>=opts.searchrange[0]&&n<=opts.searchrange[1])	out.push([n,score]);
		} else {
			out.push([n,score]);
		}
	}

	if (opts.exclude){
		const binfo=db.findbook(opts.exclude);
		if (binfo.range){
			let s=binfo.range[0],e=binfo.range[1];
			out=out.filter( item=> item[0]<s || item[0]>e )
		}
	}
	out.sort((a,b)=>b[1]-a[1]);

	return out;
}

module.exports={ simplerank ,parseTofind, weightrank}