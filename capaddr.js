//computer-aided-pariyatti addressing model
const {SEGSEP}=require("./segment");
const {getaux}=require("./db");
const {open}=require("./jsdb");
const createCAPobj=(obj,prevbk)=>{
	const def={bk:'', //book name 
		bkseq:0,
		_:0 ,  //paranum group, most book has only one.
		p:-1 ,  //paranum -1=not resolved
		x:0,   //line offset from paranum, paranum==0 from beginning of book
		       //line==1 , point to end of first line, begin of next line
		y:0,  //syllabus from begining of line
		z:0,  //syllable count ,if==-1, point to a complete word
		x0:0, //absolute linecount
		bk0:-1, //line count from this book
	};

	const out=Object.assign(def,obj);
	if (typeof prevbk!=="undefined" && out.bk=='') {
		out.bk=prevbk;
	}
	return out;
}

const stringify=function(){
	const cap=this;
	let bk=cap.bk;
	let o=bk+"_";
	if (cap._) o+=cap._;
	if (cap.p) o+='p'+cap.p;
	if (cap.x||cap.p==0) o+='x'+cap.x;
	if (cap.y) o+='y'+cap.y;
	if (cap.z==-1) o+='z';
	else if (cap.z>0) o+='z'+cap.z;
	return o;
}
const pofx=cap=>{ //x0 within the range of p,p+1
	const {paranum}=cap.db.getaux();
	const arr=paranum[cap.bkseq];
	let prev=0,l=0;
	for (var i=0;i<arr.length;i++) {
		let l=arr[i];
		if (!arr[i]) l=prev; //some arr[i] is empty , use previous value
		else l=arr[i];
		if (l>cap.bk0) {
			if (i==0) return [0, cap.bk0 ]
			return [i-1, cap.bk0-arr[i-1] ];
		}
		prev=l;
	}
	return [arr.length-1,cap.bk0-arr[arr.length-1]];
}
const CAPx0=(cap,newp)=>{
	//booksentences start from 0
	let bookstart=cap.db.id2seq(cap.bk+SEGSEP+"1");
	const {paranum}=cap.db.getaux();
	let x=cap.x;
	let p=cap.p;
	if (newp){
		x=cap.x=0;
		p=newp;
	}
	
	if (p>paranum[cap.bkseq].length-1) p=paranum[cap.bkseq].length-1
	if (p<0) p=0;

	let pstart=paranum[cap.bkseq][p];
	x+=pstart;
	x0=bookstart+x;
	return x0;
}
const dbofbk=bk=>{
	const m=bk.match(/\d+([mat])\d?_/);
	if (m) {
		return {m:"mul","a":"att","t":"tik"}[m[1]];
	}
	return '';
}
const newp=function(p){
	const cap=this;
	const n=CAPx0(cap,p);
	return parseCAP(n,cap.db);
}
const nextp=function(){
	const cap=this;
	const next=CAPx0(cap,cap.p+1);
	return parseCAP(next,cap.db);
}
const prevp=function(){
	const cap=this;
	const prev=CAPx0(cap,cap.p-1);
	return parseCAP(prev,cap.db);
}

const getline=function(seq){
	const cap=this;
	seq=seq||cap.x0;
	return cap.db.getline(seq);
}
const parse=(str,db)=>{
	const at=str.indexOf("@");
	if (at>-1){
		db=str.substr(0,at);
		str=str.substr(at+1);
	}

	if (typeof db=="string") db=open(db);
	if (typeof db=="undefined") db=open(dbofbk(str));

	if (!db) {
		throw "no db to parse cap"
	}
	let out;
	if (typeof str=='number') {//absolute jsdb line number
		str=db.seq2id(str);
	}

	if (str.indexOf(SEGSEP)>-1) {
		const at=str.indexOf(SEGSEP);
		const bkseq=parseInt(str.substr(0,at));
		const bk=db.bookseq2name(bkseq)
		const bk0=parseInt(str.substr(at+1));
		out=createCAPobj({db,bk,bkseq,bk0})
	} else {
		const at=str.indexOf("_");
		if (at==-1) {
			throw "invalid address "+str;
		}
		const arr=str.substr( at ).split(/([a-z_]\d+)/)
		.filter(item=>item);
		const bk=str.substr(0,at);
		const bkseq=db.bookname2seq(bk);
		const o={db,bk,bkseq};
		arr.forEach(item=>{
			let k=item[0];
			const v=parseInt(item.substr(1))||0;
			o[k]=v;
		});

		out=createCAPobj(o);
	}

	out.x0=CAPx0(out);
	if (out.bk0<0){
		out.bk0=out.x0-db.getbookstart(out.bk);
	}
	
	//get relative line
	if (out.p==-1) {
		p=pofx(out);
		out.p=p[0];
		out.x=p[1];
		out.x0=CAPx0(out);//x is updated
	}
	
	out.bkx=out.bkseq+SEGSEP+out.bk0;

	out.prevp=prevp.bind(out);
	out.nextp=nextp.bind(out);
	out.newp=newp.bind(out);
	out.stringify=stringify.bind(out);
	out.getline=getline.bind(out);

	return out;
}
const testdata=[
	"2:200",
	"s0101m_3p100x3",
	"s0101m_x200",
	"s0101m_p300x15y10z",
	"s0101m_p400x25y20z5",
	"s0403m3_x400y20z5",
]
const test=()=>{
	testdata.forEach(item=>{
		console.log(item,'\t==>',parseCAP(item));
	})
}
//test();
module.exports={parse};