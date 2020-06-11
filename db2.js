const parsecap2=require("./parsecap");
const {unpacksmallint}=require("./packintarr")
const Db2=function(_d){
	const db=Object.assign({},_d);
	const basedir=db.name+"/"+db.name;
	const txts=[];
	const setdata=(meta,payload)=>{
		if (meta.type=="txt"){
			settexts(meta,payload);
		} else if (meta.type=="toc"){
			//toc[meta.field]=setupToc(payload.split(/\r?\n/));
		} else if (meta.type=="xref"){
			//xrefs[meta.target]=true;
			//setupXref(meta,payload.split(/\r?\n/));
		}
	}
	const settexts=(meta,text)=>{
		const lines=text.split(/\r?\n/);
		for (var i=0;i<lines.length;i++) {
			txts[meta.start+i] = lines[i];
		}
	}
	const islineready=(x0,count)=>{
		if (typeof txts[x0]=="undefined"
			||typeof txts[x0+count-1]=="undefined") {
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
				return {bkseq,bk0,p:i-1,x: x0-bk0-(pageline[i-2]?pageline[i-2]:0)}
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
		return txts[x0]||"";
	}
	const fetchlines=(seq,count=1)=>{
		const out=[];
		for (let i=seq;i<seq+count;i++){
			out.push( [i,txts[i]]);
		}
		return out;
	}
	const load=()=>{
		//console.log("load db")
	}
	load();

	const inst={ver:2,
		bookstarts:db.bookstarts,
		getpageline,islineready,
		getsegment,pagefromx0,
		scriptOfLines,getline,fetchlines,setdata};
	
	ODef=Object.defineProperty;

	ODef(inst,'booknames', {get:()=>db.booknames});
	ODef(inst,'extra', {get:()=>db.extra});
	ODef(inst,'payload', {get:()=>db.payload, set:py=>db.payload=py});
	ODef(inst,'bookstarts',{get:()=>db.bookstarts});
	ODef(inst,'totalline', {get:()=>db.txtstarts[db.txtstarts.length-1]});

	return inst;
}

module.exports=Db2;
