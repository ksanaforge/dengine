'use strict';
const {unpack3}=require("./packintarr");
const {SEGSEP,LANGSEP,LEVELSEP,BOOKNAME_REGEXP}=require("./segment");
const {commontokens,inflate}=require("./textcompress");
const Db=function(_d){
	let db=Object.assign({},_d);
	const basedir=db.name+"/"+db.name;
	let bookhierarchy={};
	let booksentences={}; //bookid as key, value is array of sentence id, startseq
	let bookstarts=[];//start seq of each book
	let booknames=[];
	let txts=[]; 
	let indexes={};
	let doclens={};
	let tokenss={};
	let postingss={};
	let freqtokens={};


	let issearchready=f=>{
		let fields=f;
		if (!Array.isArray(fields)) fields=[f];
		for (var f of fields){
			if (!tokenss[f]||!doclens[f])return false;
		}
		return true;
	}
	let istextready=idarr=>{
		var ready=true;
		if (db.txtdeflated) {
			if (!issearchready(db.fields)) {
				return false;
			}
		}
		forEachId(idarr, (id,seq)=>{
			if (seq<0  || typeof txts[seq]=="undefined") {
				ready=false;
			}
		});
		return ready;
	}

	let ispostingready=(field,tokens)=>{
		var ready=true;
		if (!tokenss[field] || !postingss[field])return false;
		tokens.forEach((tk)=>{
			var token=tk[0],seq;
			seq=tokenss[field].indexOf(token);
			if (seq<0 || !postingss[field] || typeof postingss[field][seq]=="undefined") {
				ready=false;
			}
		});
		return ready;
	}


	let getneighbour=(prefix,opts)=>{
		let out=[], idarr=[],seqarr=[];

		const max=opts.max;
		const at=prefix.indexOf(SEGSEP);
		let bookid=prefix.substr(0,at);
		const bookseq=booknames.indexOf(bookid);
		
		let sentenceid=prefix.slice(at+1);
		let fixmissplacetitle=seq=>{//title might be miss placed in previous group
			const previd=seq2id(seq-1);
			idarr.push(previd);
			seqarr.push(seq-1);
		}

		if (!bookid) bookid=prefix;
		
		if (booksentences[bookid]) {
			let n=booknames.indexOf(bookid);
			let seq=bookstarts[n];
			const sentences=booksentences[bookid];
			if (at==-1) {//only book
				for (let i=0;i<sentences.length&&i<max;i++){
					idarr.push(bookid+SEGSEP+sentences[i]);
					seqarr.push(seq+i);
				}
			} else {
				let i=0,prefixseq;
				if (sentences.indexOf(sentenceid)>-1){ //exact id , get siblings
					const levels=sentenceid.split(LEVELSEP);
					levels.pop();
					sentenceid=levels.join(LEVELSEP);
					prefixseq=id2seq(prefix);
				}
				while (i<sentences.length&&out.length<max){
					const leading= sentences[i].substr(0,sentenceid.length);
					if (leading==sentenceid) {
						if (!idarr.length&&prefixseq>1) fixmissplacetitle(seq+i);
						idarr.push(bookid+SEGSEP+sentences[i]);
						seqarr.push(seq+i);
					} else {
						if (idarr.length) {
							idarr.push(bookid+SEGSEP+sentences[i]);
							seqarr.push(seq+i);
							break; //seq should be continuous 
						}
					}
					i++;
				}
			}
			
			return [idarr,seqarr];
		} else {
			return 0; //book not found
		}
	}
	let id2seq=id=>{ //seq starts from 1, 0 ==not found
		const at=id.indexOf(SEGSEP);
		let bookid=id.substr(0,at);
		const bookseq=booknames.indexOf(bookid);
		let sentence=id.slice(at+1);

		const sentences=booksentences[bookid];
		if (!sentences)return 0;
		for (var i=0;i<sentences.length;i++){
			if (sentence==sentences[i]) {
				return bookstarts[bookseq]+i;
			}
		}
		return 0;
	}
	let seq2id=(seq)=>{
		for (var i=0;i<bookstarts.length;i++){
			if (seq<bookstarts[i]) {
				const at=seq-bookstarts[i-1];
				const bknm=booknames[i-1];
				return bknm+SEGSEP+booksentences[bknm][at];
			};
		}
		return "";
	}
	let seq2page=(seq,field,type)=>{
		let starts=db.txtstarts;
		if (field){
			var q=db.fields.indexOf(field);
			if (q<0) return q;
			starts=db[type+"starts"][q];			
		}
		for (var i=0;i<starts.length;i++){
			if (seq<starts[i]) return i-1;
		}
	}
	let id2filename=id=>{
		let seq=id2seq(id);
		return seq2filename(seq);
	}
	let seq2filename=seq=>{
		const page=seq2page(seq,"","txt");
		if (page>-1)return basedir+".txt."+page+".js";		
	}
	let tokenseq2filename=(field,tokenseq)=>{
		const page=seq2page(tokenseq,field,"idx");
		if (page>-1)return basedir+"."+field+".idx."+page+".js";
	}

	let forEachId=(idarr,cb)=>{
		if (!Array.isArray(idarr)) idarr=[idarr];
		for (let id of idarr) {
			const seq=id2seq(id);
			cb(id,seq);
		}
	}

	let filesFromSeq=seqarr=>{
		const files={};
		seqarr.forEach( seq=> files[seq2filename(seq)]=true);
		return Object.keys(files).filter(f=>!!f);
	}

	let filesFromId=idarr=>{
		const files={};
		forEachId(idarr,(id,seq)=>{
			let fn=id2filename(id);
			if (fn) files[fn]=true;				
		});
		return Object.keys(files);
	}
	let filesFromTokens=(field,tokens)=>{
		const files={};
		tokens.forEach((tk)=>{
			var token=tk,seq;
			if (Array.isArray(token)) {
				token=tk[0]
				seq=tk[1];//token with tokenseq
			} else {
				seq=tokenss[field].indexOf(token);
			}
			const fn=tokenseq2filename(field,seq);
			if (fn) files[fn]=true;		
		});
		return Object.keys(files);
	}
	let fetch=(idarr)=>{
		const out=[];
		forEachId(idarr,(id,seq)=>{
			let content=txts[seq].split(LANGSEP);

			let o=[id];
			for (var i=0;i<db.fields.length;i++){
				if (db.txtdeflated) {
					const ft=freqtokens[db.fields[i]];
					o.push(inflate(content[i],ft));					
				} else {
					o.push(content[i]);
				}

			}
			out.push(o);
		});
		return out;
	}

	let setdata=(meta,payload)=>{
		if (meta.type=="txt"){
			settexts(meta,payload);
		} else if (meta.type=="idx"){
			setposting(meta,payload);
		} else if (meta.type=="token"){
			tokenss[meta.field]=payload.split(/\r?\n/);
			freqtokens[meta.field]=commontokens(tokenss[meta.field]);
		} else if (meta.type=="doclen"){
			doclens[meta.field]=unpack3(payload);
		}
	}
	let settexts=(meta,text)=>{
		const lines=text.split(/\r?\n/);
		for (var i=0;i<lines.length;i++) {
			txts[meta.start+i] = lines[i];
		}
	}
	let setposting=(meta,payload)=>{
		const dbpostings=postingss[meta.field]||[];
		postingss[meta.field]=dbpostings;
		const postings=payload.split(/\r?\n/)
		for (var i=0;i<postings.length;i++){
			dbpostings[meta.start+i]=postings[i];
		}
	}
	const guesscache={};
	let guesslanguage=(pat)=>{
		if (guesscache[pat]) {
			console.log("guess cache")
			return guesscache[pat];
		}
		let matchcount={};
		const enoughhit=10;
		for (let lang in tokenss){
			matchcount[lang]=0;
			let tokens=tokenss[lang];
			for (var i=0;i<tokens.length;i++){
				if (tokens[i].match(pat)){
					matchcount[lang]++;
					if (matchcount[lang]>enoughhit)break;
				}
			}
		}
		let arr=[];
		for (let lang in matchcount){
			arr.push([lang,matchcount[lang]]);
		}
		arr.sort( (a,b)=>b[1]-a[1]);
		let lang=arr[0][0];
		guesscache[pat]=lang;
		return lang;
	}
	const tokencache={};
	let findtokens=(field,patterns)=>{
		const out={};
		for (let key in patterns){
			let pat=patterns[key];
			if (tokencache[pat]) {
				out[key]=tokencache[pat];
				continue;
			}
			let matches=[];
			//if (!tokenss[field]) {
			//	out[key]=[];
			//}
			const tokens=tokenss[field];
			for (var i=0;i<tokens.length&&matches.length<50;i++){
				if (tokens[i].match(pat)) matches.push([tokens[i],i]);
			}
			out[key]=matches;
			tokencache[pat]=matches;
		}
		return out;
	}
	let getpostings=(field,tks)=>{
		let out=Object.assign([],tks);

		for (let i=0;i<tks.length;i++){
			let tk=tks[i];
			let token=tk,seq;
			if (Array.isArray(token)) {
				token=tk[0]
				seq=tk[1];//token with tokenseq
			} else {
				if (!postingss[field]){
					console.error("cannot load field",field);
					continue;
				}
				seq=postingss[field].indexOf(token);
			}

			out[i][1]=postingss[field][seq];
			if (typeof out[i][1]=="string"){
				postingss[field][seq]=out[i][1]=unpack3(out[i][1]);
			}
		};
		return out;
	}
	let buildbookhierarchy=()=>{
		for (var i=0;i<booknames.length;i++){
			let m=booknames[i].match(BOOKNAME_REGEXP);
			let serialname=m[1];
			let subbook=m[2];
			let subsubbook=null;
			let at=booknames[i].indexOf(".");
			if (at>-1){
				subsubbook=booknames[i].substr(at+1);
			} else {
				subbook=parseInt(m[2]);
			}
			if (!bookhierarchy[serialname]) {
				bookhierarchy[serialname]=[];
			}
			if (subsubbook){
				if (!bookhierarchy[serialname][subbook-1]){
					bookhierarchy[serialname][subbook-1]=[];
				}
				bookhierarchy[serialname][subbook-1].push(subsubbook);
			} else {
				bookhierarchy[serialname].push(subbook);	
			}
		}
	}
	let getSerials=()=>Object.keys(bookhierarchy);
	let getHierarchy=name=> {
		let m=name.match(BOOKNAME_REGEXP);
		if (m[2]) {
			return bookhierarchy[m[1]][parseInt(m[2])-1];
		} else {
			return bookhierarchy[name];	
		}
	}
	let getBlurb=name=>db.blurb[name];
	let load=()=>{
		let sentences=[],book='';
		bookstarts=[0];
		db.segids=_d.segids.split(/\r?\n/);
		for (var i=0;i<db.segids.length;i++) {
			let id=db.segids[i];
			if (id.indexOf(SEGSEP)>0) {
				if (book){
					bookstarts.push(i);
					booksentences[book]=sentences;
					booknames.push(book);
				}
				let at=id.indexOf(SEGSEP);
				book=id.substr(0,at);
				sentences=[ id.slice(at+1) ];
			} else{
				sentences.push(id);
			}
		}
		booksentences[book]=sentences;
		bookstarts.push(i);
		booknames.push(book);
		buildbookhierarchy();
	}
	
	let fields=()=>db.fields;
	let deflated=()=>db.txtdeflated;
	let averagelength=(field)=>{
		const at=db.fields.indexOf(field);
		if (at==-1)return -1;

		return db.txtlengths[at] / db.txtstarts[db.txtstarts.length-1];
	}
	load();
	let getdoclen=(field,docid)=>doclens[field][docid];
	let gettokens=(field)=>tokenss[field];
	let findbook=prefix=>{
		if (booksentences[prefix]){
			const n=booknames.indexOf(prefix);
			let start=bookstarts[n];
			let end=bookstarts[n+1];
			return {range:[start,end], books:[[prefix, booksentences[prefix]]  ] };
		} else {
			let books=[],start,end,out={};
			if (prefix=="") {
				out.range=[bookstarts[0],bookstarts[bookstarts.length-1]];
				return out;
			}
			for (var i=0;i<booknames.length;i++){
				let  name=booknames[i];
				if (prefix==name.substr(0,prefix.length)){
					let n=booknames.indexOf(name);
					if (!start) start=bookstarts[n];
					end=bookstarts[n+1];
					books.push([name, booksentences[name]] )
				}
			}
			if (start&&books.length) {
				out.range=[start,end];
				out.books=books;
			}
			return out;
		}
		return {};
	}
	return {
		filesFromId,filesFromSeq,filesFromTokens,fields,
		istextready,issearchready,ispostingready,deflated,
		fetch,setdata,basedir,id2seq,seq2id,getneighbour,
		findtokens,getpostings,getdoclen,gettokens,findbook,
		getSerials,getHierarchy,getBlurb,guesslanguage,averagelength
	}
}
module.exports=Db;