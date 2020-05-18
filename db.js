'use strict';
const {unpack3}=require("./packintarr");
const bsearch=require("./bsearch");
const {SEGSEP,LANGSEP,LEVELSEP,BOOKNAME_REGEXP}=require("./segment");
const {commontokens,inflate}=require("./textcompress");
const {setupToc}=require("./toc");
const {setupXref,xrefofpage,fromxref}=require("./xref");

const Db=function(_d){
	const db=Object.assign({},_d);
	const basedir=db.name+"/"+db.name;
	const bookhierarchy={};
	const booksentences={}; //bookid as key, value is array of sentence id, startseq
	const bookstarts=[];//start seq of each book
	const booknames=[];
	const txts=[]; 
	const indexes={};
	const doclens={};
	const toc={};
	const xrefs={};
	const tokenss={};
	const postingss={};
	const freqtokens={};
	const wordcounts={};


	const issearchready=f=>{
		if (db.textonly)return false;
		let fields=f;
		if (!Array.isArray(fields)) fields=[f];
		for (var f of fields){
			//if (!tokenss[f]||!doclens[f])return false;
			if (!tokenss[f])return false;
		}
		return true;
	}
	const istextready=idarr=>{
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

	const ispostingready=(field,tokens)=>{
		var ready=true;
		if (!tokenss[field] || !postingss[field])return false;
		tokens.forEach((tk)=>{
			var token=tk[0],seq=tk[1];
			//seq=tokenss[field].indexOf(token);
			if (seq<0 || !postingss[field] || typeof postingss[field][seq]=="undefined") {
				ready=false;
			}
		});
		return ready;
	}
	const parsepagenum=id=>{
		let at=id.indexOf(SEGSEP);
		let bookname=id.substr(0,at);
		const bk=booknames.indexOf(bookname);
		let page=id.slice(at+1) ,ln=1;
		at=page.indexOf(LEVELSEP);
		if (at>-1) {
			ln=parseInt( page.slice(at+1));
		}
		if (isNaN(ln)) ln=1;
		let pg=parseInt(page);
		return {bookname,bk,pg,ln};		
	}

	const getbookpagelinecount=(book,pagenum)=>{
		return Array.isArray(booksentences[book])?
			booksentences[book][pagenum]-booksentences[book][pagenum-1]:1;
	}
	const getbookpagecount=(book)=>{
		if (!Array.isArray(booksentences[book])) {
			return 1; //one line per page
		}
		return booksentences[book].length - 1;
	}
	//return entire page, last line of previous page, first line of next page
	const getneighbour_cont=(prefix,opts)=>{
		let {bookname,bk,pg} = parsepagenum(prefix);
		if (!bookname) bookname=booknames[0];
		const idarr=[],seqarr=[];
		const pcount=getbookpagecount(bookname) //extra ending page

		if (opts.plusminus){
			pg+=parseInt(opts.plusminus);
			if (pg<1)pg=1;
			if (pg>pcount)pg=pcount;
		}

		let seq=id2seq_cont(bookname+SEGSEP+pg);

		if (pg>1) { //last line of previous page
			const lcount=getbookpagelinecount(bookname,pg-1);
			idarr.push(bookname+SEGSEP+(pg-1)+LEVELSEP+lcount);
			seqarr.push(seq-1);
		}

		const pagecount=opts.pagecount||1;

		for (let j=pg;j<pg+pagecount;j++) {
			const linecount=getbookpagelinecount(bookname,j);
			for (let i=1;i<linecount+1;i++){
				idarr.push(bookname+SEGSEP+j+LEVELSEP+i);
				seqarr.push(seq);
				seq++;
			}
		}

		if ((pg+pagecount-1)<pcount) {
			idarr.push(bookname+SEGSEP+(pg+pagecount)+LEVELSEP+"1");
			seqarr.push(seq);
		}
		return [idarr,seqarr];
	}

	const getneighbour=(prefix,opts)=>{
		if (db.continuouspage) {
			return getneighbour_cont(prefix,opts)
		}

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

	const id2seq_cont=id=>{
		const {bookname,pg,ln} = parsepagenum(id);
		if (isNaN(pg))return -1;

		const arr=booksentences[bookname];
		if (typeof arr=="undefined")return -1;
		return Array.isArray(arr)?booksentences[bookname][pg-1]+(ln-1)
		:(arr+pg-1);//one line per page
	}
	const id2seq=id=>{ //seq starts from 1, 0 ==not found
		if (db.continuouspage) return id2seq_cont(id);
	
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
	const seq2id_cont=seq=>{
		let book='',page=0,sen=0;
		for (let i=0;i<booknames.length;i++){
			const pages=booksentences[i];
			book=booknames[i];
			for (let j=0;j<pages.length;j++) {
				if (pages[j]>seq) {
					page=j;
					sen=pages[j]-seq;
					break;
				}
			}
			if (sen) break;
		}
		return book+SEGSEP+page+LEVELSEP+sentence;
	}
	const seq2id=seq=>{
		if (db.continuouspage) return seq2id_cont(seq); 
		for (var i=0;i<bookstarts.length;i++){
			if (seq<bookstarts[i]) {
				const at=seq-bookstarts[i-1];
				const bknm=booknames[i-1];
				return bknm+SEGSEP+booksentences[bknm][at];
			};
		}
		return "";
	}
	const seq2page=(seq,field,type)=>{
		let starts=db.txtstarts;
		if (field){
			var q=fieldseq(field);
			if (q<0) return q;
			starts=db[type+"starts"][q];			
		}
		for (var i=0;i<starts.length;i++){
			if (seq<starts[i]) return i-1;
		}
	}
	const id2filename=id=>{
		let seq=id2seq(id);
		return seq2filename(seq);
	}
	const seq2filename=seq=>{
		const page=seq2page(seq,"","txt");
		if (page>-1)return basedir+".txt."+page+".js";		
	}
	const tokenseq2filename=(field,tkseq)=>{
		const page=seq2page(tkseq,field,"idx");
		if (page>-1)return basedir+"."+field+".idx."+page+".js";
	}

	const forEachId=(idarr,cb)=>{
		if (!Array.isArray(idarr)) idarr=[idarr];
		for (let id of idarr) {
			const seq=id2seq(id);
			cb(id,seq);
		}
	}

	const filesFromSeq=seqarr=>{
		const files={};
		seqarr.forEach( seq=> files[seq2filename(seq)]=true);
		return Object.keys(files).filter(f=>!!f);
	}

	const filesFromId=idarr=>{
		const files={};
		forEachId(idarr,(id,seq)=>{
			let fn=id2filename(id);
			if (fn) files[fn]=true;				
		});
		return Object.keys(files);
	}
	const filesFromTokens=(field,tokens)=>{
		const files={};
		tokens.forEach((tk)=>{
			var token=tk,seq;
			if (Array.isArray(token)) {
				token=tk[0]
				seq=tk[1];//token with tokenseq
			}
			if (seq==-1) {
				seq=bsearch(tokenss[field],token);
				tk[1]=seq;
			}
			const fn=tokenseq2filename(field,seq);
			if (fn) files[fn]=true;		
		});
		return Object.keys(files);
	}
	const fetch=(idarr)=>{
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
	const setdata=(meta,payload)=>{
		if (meta.type=="txt"){
			settexts(meta,payload);
		} else if (meta.type=="idx"){
			setposting(meta,payload);
		} else if (meta.type=="token"){
			tokenss[meta.field]=payload.split(/\r?\n/);
			wordcounts[meta.field]=meta.wordcount;
			freqtokens[meta.field]=commontokens(tokenss[meta.field]);
		} else if (meta.type=="doclen"){
			doclens[meta.field]=unpack3(payload);
		} else if (meta.type=="toc"){
			toc[meta.field]=setupToc(payload.split(/\r?\n/));
		} else if (meta.type=="xref"){
			xrefs[meta.target]=true;
			setupXref(meta,payload.split(/\r?\n/));
		}
	}
	const settexts=(meta,text)=>{
		const lines=text.split(/\r?\n/);
		for (var i=0;i<lines.length;i++) {
			txts[meta.start+i] = lines[i];
		}
	}
	const setposting=(meta,payload)=>{
		const dbpostings=postingss[meta.field]||[];
		postingss[meta.field]=dbpostings;
		const postings=payload.split(/\r?\n/)
		for (var i=0;i<postings.length;i++){
			dbpostings[meta.start+i]=postings[i];
		}
	}
	const guesscache={};
	const guesslanguage=(pat)=>{
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
	const tokenseq=(token,field)=>{
		const tokens=tokenss[field];
		if (!tokens)return -1;
		return bsearch(tokens,token);
	}

	const tokencache={};
	const findtokens=(field,patterns)=>{
		const out={};
		for (let key in patterns){
			let pat=patterns[key];
			if (tokencache[pat]) {
				out[key]=tokencache[pat];
				continue;
			}
			let matches=[];
			if (!tokenss[field]) {
				out[key]=[];
			}
			const tokens=tokenss[field];
			for (var i=0;i<tokens.length&&matches.length<50;i++){
				if (tokens[i].match(pat)) matches.push([tokens[i],i]);
			}
			out[key]=matches;
			tokencache[pat]=matches;
		}
		return out;
	}
	const getpostings=(field,tks)=>{
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
				seq=bsearch(tokenss[field],token);
			}

			out[i][1]=postingss[field][seq];
			if (typeof out[i][1]=="string"){
				postingss[field][seq]=out[i][1]=unpack3(out[i][1]);
			}
		};
		return out;
	}
	const buildbookhierarchy=()=>{
		for (var i=0;i<booknames.length;i++){
			let m=booknames[i].match(BOOKNAME_REGEXP);
			if (!m){
				//book hierarchy info cannot get from segid
				//(nanchaun and pts, vol-pagenum
				return;
			}

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
	const getSerials=()=>Object.keys(bookhierarchy);
	const getHierarchy=name=> {
		let m=name.match(BOOKNAME_REGEXP);
		if (m[2]) {
			return bookhierarchy[m[1]][parseInt(m[2])-1];
		} else {
			return bookhierarchy[name];	
		}
	}
	const getBlurb=name=>db.blurb[name];
	const load=()=>{
		let sentences=[],book='';
		bookstarts.length=1;
		bookstarts[0]=0;
		db.segids=_d.segids.split(/\r?\n/);

		for (var i=0;i<db.segids.length;i++) {
			let id=db.segids[i];
			if (id.indexOf(SEGSEP)>0) {
				if (book){
					bookstarts.push(i);
					if (db.continuouspage) sentences=JSON.parse(sentences[0]);
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
		if (db.continuouspage) sentences=JSON.parse(sentences[0]);
		
		booksentences[book]=sentences;
		bookstarts.push(i);
		booknames.push(book);
		buildbookhierarchy();
	}
	const fieldseq=field=>db.fields.indexOf(field);
	const deflated=()=>db.txtdeflated;
	const averagelength=field=>{
		const at=db.fields(field);
		if (at==-1)return -1;

		return db.txtlengths[at] / db.txtstarts[db.txtstarts.length-1];
	}
	const termweight=(term,field)=>{
		const average= wordcounts[field] / tokenss[field].length;
		const seq=bsearch(tokenss[field],term);
		if (seq<0) return 0;//no weight
		const posting=postingss[field][seq];
		return  average / posting.length;	
	}
	
	const searchable=()=>!db.textonly;
	const getdoclen=(field,docid)=>doclens[field][docid];
	const gettokens=(field)=>field?tokenss[field]:tokenss[ db.fields[0]];
	const getfields=()=>db.fields;
	const withtoc=()=>db.withtoc;
	const withnote=()=>db.withnote;
	const withxref=()=>db.withxref;
	const getaux=()=>db.aux;
	const gettoc=field=>field?toc[field]:toc[db.fields[0]];
	const getxref=field=>field?xrefs[field]:xrefs[db.fields[0]];
	
	const getDate=()=>db.date;

	const getxrefofpage=(sid)=>{
		if (Array.isArray(sid)) {
			let out={};
			sid.map( item=> Object.assign(out,xrefofpage(db.name,item)));
			return out;
		} else {
			return xrefofpage(db.name,sid);
		}
	}

	const getfromxref=(targetdb,vol,pagenum)=>{
		return fromxref(db.name,targetdb,vol,pagenum);
	}
	
	const findbook=prefix=>{
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
		return null;
	}
	load();
	return {
		filesFromId,filesFromSeq,filesFromTokens,searchable,
		istextready,issearchready,ispostingready,deflated,getfields,
		fetch,setdata,basedir,id2seq,seq2id,getneighbour,tokenseq,
		findtokens,getpostings,getdoclen,gettokens,findbook,fieldseq,
		getSerials,getHierarchy,getBlurb,guesslanguage,averagelength,termweight,
		withtoc,withnote,withxref,gettoc,getxref,getDate,
		getxrefofpage,getfromxref,getaux
	}
}
module.exports=Db;