//computer-aided-pariyatti addressing model
const {SEGSEP}=require("./segment");
const {getaux}=require("./db");
const {open}=require("./jsdb");
const {syllabify,isSyllable}=require("./paliutil")
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
		px:0,  //total line of this p
		       // x0-x+px   ==> first line of next p
		       // x0-x      ==> first line of this p
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
			if (i==0) return [0, cap.bk0 ];
			while( !arr[i-1] && i>1) {	
				i--; //some para is missing s0403a3 no p25,p26 
			} 
			let j=i;
			while (!arr[j]&&j<arr.length-1) j++;
			return [i-1, cap.bk0-arr[i-1], arr[j]-arr[i-1] ];
		}
		prev=l;
	}
	let px=1;
	if (paranum[cap.bkseq+1]) {
		const nextbookstart=cap.db.getbookstart(cap.bkseq);
		px=nextbookstart-arr[arr.length-1];
	} else {
		const thisbookstart=cap.db.getbookstart(cap.bkseq-1);
		px=cap.db.totalline()-thisbookstart-arr[arr.length-1];
	}

	return [arr.length-1,cap.bk0-arr[arr.length-1], px ];
}
const CAPx0=(cap)=>{
	//booksentences start from 0
	//let bookstart=cap.db.id2seq(cap.bk+SEGSEP+"1");
	let bookstart=cap.db.getbookstart(cap.bk);
	const {paranum}=cap.db.getaux();
	let x=cap.x;
	let p=cap.p;

	if (p==-1) {
		let bk0=cap.bk0; //resolved by n:n format
		if (bk0==-1) bk0=0;
		return bookstart+bk0+x;
	}
	const parr=paranum[cap.bkseq];

	if (p>parr.length-1) {
		p=parr.length-1
	}
	if (p<0) p=0;

	while (p&&p<parr.length && !parr[p]) {
		p++;
	} 
	
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
const floor=function(){ //to begining of this line
	const cap=this;
	if (cap.x) {
		cap.x0-=cap.x;
		cap.bk0-=cap.x;
		cap.x=0;
	}
	return cap.x0;
}
const nextp=function(){
	const cap=this;
	const np=cap.x0-cap.x+cap.px;
	return parse(np,cap.db);
}
const prevp=function(){
	const cap=this;
	let prev=cap.x?cap.x0-cap.x:cap.x0-1;
	const pv = parse(prev,cap.db);
	pv.floor();
	return pv;
}
const getline=function(seq){
	const cap=this;
	seq=seq||cap.x0;
	return cap.db.getline(seq);
}
const getsel=function(){
	const cap=this;
	if (cap.y<0||cap.z<1) return null;		
	const t=this.getline();
	const arr=syllabify(t);
	let y=0,out='';
	for (let i=0;i<arr.length;i++){
		const snip=arr[i];
		if (isSyllable(snip)) y++;

		if (y>cap.y) out+=snip;
		if (y>=cap.y+cap.z) break;
	}
	return out;
}
const parse=(str,db)=>{
	if (typeof str=="string"){
		const at=str.indexOf("@");
		if (at>-1){
			db=str.substr(0,at);
			str=str.substr(at+1);
		}		
	}

	if (typeof db=="string") db=open(db);
	if (typeof db=="undefined") db=open(dbofbk(str));

	if (!db) {
		throw "no db to parse cap "+str
	}
	let out;
	if (typeof str=='number') {//absolute jsdb line number
		str=db.seq2id(str+1);
	}

	if (str.indexOf(SEGSEP)>-1) {
		const at=str.indexOf(SEGSEP);
		const bkseq=parseInt(str.substr(0,at));
		const bk=db.bookseq2name(bkseq)
		const bk0=parseInt(str.substr(at+1))-1;
		out=createCAPobj({db,bk,bkseq,bk0})
	} else {
		const at=str.indexOf("_");
		if (at==-1) {
			throw "invalid address "+str;
		}
		const arr=str.substr( at ).split(/([a-z_]\d+)/)
		.filter(item=>item);
		let bk=str.substr(0,at);
		let bkseq=0;
		if (parseInt(bk).toString()===bk) {
			bkseq=parseInt(bk);
			bk=db.bookseq2name(bkseq);
		} else {
			bkseq=db.bookname2seq(bk);
		}

		const o={db,bk,bkseq};
		arr.forEach(item=>{
			let k=item[0];
			const v=parseInt(item.substr(1))||0;
			o[k]=v;
			if (k=="z" && v==0) o[k]=-1;//ends with z without number
		});

		out=createCAPobj(o);
	}

	out.x0=CAPx0(out);
	if (out.bk0<0){
		out.bk0=out.x0-db.getbookstart(out.bk);
	}
	
	//get relative line
	const pp=pofx(out);
	out.p=pp[0]; //paranum
	out.x=pp[1]; //line offset
	out.px=pp[2];//line of this para

	out.bkx=out.bkseq+SEGSEP+(out.bk0+1);

	out.prevp=prevp.bind(out);
	out.nextp=nextp.bind(out);
	out.floor=floor.bind(out);
	out.stringify=stringify.bind(out);
	out.getline=getline.bind(out);
	out.getsel=getsel.bind(out);

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