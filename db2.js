'use stricts';
const parsecap2=require("./parsecap");
const {unpacksmallint}=require("./packintarr")
const {setupToc,getTocAncestor}=require("./toc");
const {addlink,findbacklinks}=require("./backlink");
const Db2=function(_d){
	const db=Object.assign({},_d);
	const basedir=db.name+"/"+db.name;
	const _txts=[],_backlinks={};
	let _toc=null;
	const setdata=(meta,payload)=>{
		if (meta.type=="txt"){
			settexts(meta,payload);
		} else if (meta.type=="toc"){
			_toc=setupToc(payload.split(/\r?\n/));
		} else if (meta.type=="xref"){
			//xrefs[meta.target]=true;
			//setupXref(meta,payload.split(/\r?\n/));
		}
	}
	const settexts=(meta,text)=>{
		const lines=text.split(/\r?\n/);
		for (var i=0;i<lines.length;i++) {
			_txts[meta.start+i] = lines[i];
		}
	}
	const islineready=(x0,count)=>{
		if (typeof _txts[x0]=="undefined"
			||typeof _txts[x0+count-1]=="undefined") {
				return false;
		}
		return true;
	}
	const getsegment=(x0,type="txt")=>{
		let starts=db[type+"starts"];
		for (var i=0;i<starts.length;i++){
			if (x0<starts[i]) return i-1;
		}
		return starts.length-2; // page files not more than this
	}
	const bookfromx0=x0=>{
		for (var i=0;i<db.bookstarts.length;i++){
			if (x0<db.bookstarts[i]) return i-1;
		}
		return db.bookstarts.length-2;	
	}
	const getpageline=bkseq=>{
		let pageline=db.pagelines[bkseq];
		if (!pageline)return null;
		if (Array.isArray(pageline)) {
			return pageline;
		} else {
			const arr=unpacksmallint(pageline);
			for (var i=1;i<arr.length;i++) {
				arr[i]+=arr[i-1];
			}
			db.pagelines[bkseq]=arr;
		}

		return db.pagelines[bkseq];
	}
	const pagefromx0=x0=>{
		const bkseq=bookfromx0(x0);
		const pageline=getpageline(bkseq);
		const bk0=db.bookstarts[bkseq];

		for (var i=0;i<pageline.length;i++){
			if (x0<bk0+pageline[i]) {
				if (i==0) i=1;
				return {bkseq,bk0,_:i-1,x: x0-bk0-(pageline[i-2]?pageline[i-2]:0)}
			};
		}
		return {bkseq,bk0,p:pageline.length-1,
			x: x0-bk0-pageline[pageline.length-2]};
	}
	const scriptOfLines=(x0,count=1)=>{
		const startpage=getsegment(x0,"txt");
		const endpage=getsegment(x0+count,"txt");
		const files=[];
		for (var i=startpage;i<=endpage;i++) {
			files.push(basedir+".txt."+i+".js");
		}
		return files;
	}
	const getline=x0=>{
		return _txts[x0]||"";
	}
	const fetchlines=(seq,count=1)=>{
		const out=[];
		for (let i=seq;i<seq+count;i++){
			out.push( [i,_txts[i]]);
		}
		return out;
	}
	const getbacklinks=sid=>{
		return findbacklinks(_backlinks,sid)
	}
	const load=()=>{
		//console.log("load db")
	}
	load();
	const gettocancestor=sid=>getTocAncestor(_toc,sid);

	const inst={ver:2,
		bookstarts:db.bookstarts,
		getpageline,islineready,
		getbacklinks,
		getsegment,pagefromx0,gettocancestor,
		scriptOfLines,getline,fetchlines,setdata};
	
	ODef=Object.defineProperty;

	inst.addlink=addlink.bind(_backlinks)
	ODef(inst,'name', {get:()=>db.name});
	ODef(inst,'basedir', {get:()=>basedir});
	ODef(inst,'booknames', {get:()=>db.booknames});
	ODef(inst,'extra', {get:()=>db.extra});
	ODef(inst,'backlinks', {get:()=>_backlinks});
	ODef(inst,'withtoc', {get:()=>db.withtoc});
	ODef(inst,'toc', {get:()=>_toc});
	ODef(inst,'builddate', {get:()=>db.date});
	ODef(inst,'payload', {get:()=>db.payload, set:py=>db.payload=py});
	ODef(inst,'bookstarts',{get:()=>db.bookstarts});
	ODef(inst,'totalline', {get:()=>db.txtstarts[db.txtstarts.length-1]});

	return inst;
}

module.exports=Db2;
