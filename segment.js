'use strict';
const bookname=[
'pli-tv-bu-pm',
'pli-tv-bi-pm',
'pli-tv-bu-vb-pj',
'pli-tv-bu-vb-ss',
'pli-tv-bu-vb-ay',
'pli-tv-bu-vb-np',
'pli-tv-bu-vb-pc',
'pli-tv-bu-vb-pd',
'pli-tv-bu-vb-sk',
'pli-tv-bu-vb-as',
'pli-tv-bi-vb-pj',
'pli-tv-bi-vb-ss',
'pli-tv-bi-vb-ay',
'pli-tv-bi-vb-np',
'pli-tv-bi-vb-pc',
'pli-tv-bi-vb-pd',
'pli-tv-bi-vb-sk',
'pli-tv-bi-vb-as',
'pli-tv-kd',
'pli-tv-pvr',

 "dn","mn","sn","an",
"kn","kp","dhp","ud","iti","snp","vv","pv",
"thag","thig","ja","mnd","cnd","ps",
"tha-ap","thi-ap","bv","cp","ne","pe","mil",

"ds","vb","dt","pp","ya","patthana","kv"

 ];

const hotfix={
  "an1.259.1.1": "an1.259:1.1",
  "an1.260.1.1": "an1.260:1.1",
  "an1.261.1.1": "an1.261:1.1",
  "an1.262.1.1": "an1.262:1.1",
  "an1.263.1.1": "an1.263:1.1",
  "an1.264.1.1": "an1.264:1.1",
  "an1.265.1.1": "an1.265:1.1",
  "an1.266.1.1": "an1.266:1.1",
  "an1.267.1.1": "an1.267:1.1",
  "an1.267.1.2": "an1.267:1.2",
  "an1.267.1.3": "an1.267:1.3",
  "an2.4.0.1":"an2:4.0.1",
 // "pli-tv-bi-vb-sk1:75:0.2":"pli-tv-bi-vb-sk75:0.2",
 // "pli-tv-bi-vb-sk1:75:0.1":"pli-tv-bi-vb-sk75:0.1",
 //  "bi-sk1:75:0.2":"bi-sk75:0.1",
 // "bi-sk1:75:0.1":"bi-sk75:0.1"   need to fix files, cannot hotfix
}
const BOOKNAME_REGEXP=/^([a-z\-\.]+)(\d*)$/
const SEGSEP=":";
const LEVELSEP=".";
const LANGSEP="|||"
const parsesegmentid= id=>{
	let obj=[];

	var at=id.indexOf(SEGSEP);
	if (hotfix[id]) {
		//debugger
		id=hotfix[id];
		at=id.indexOf(SEGSEP);
	}

	if (at==-1)	return [id,'',0,0,0,0];

	const fn=id.substr(0,at);
	const para=id.substr(at+1);
	const ch=fn.split(".");
	const pr=para.split(".");

	let m=ch[0].match(BOOKNAME_REGEXP);
	if (!m) {
		obj[0]=ch[0]; //no ascii prefix
		obj[1]='';
	} else {
		obj[0]=m[1];
		obj[1]=m[2];
	}
	obj[2]=ch[1];
	obj[3]=ch[2];//abhidhamma ds2.1.1:0.1
	for (var i=0;i<pr.length;i++){
		obj[i+4]=pr[i];
	}
	for (var i=2;i<obj.length;i++) { //2020.5.25, check from 3rd item
		const int=parseInt(obj[i]);  //for csmat
		obj[i]=isNaN(int)?0:int;
	}
	return obj;
}
const comparesegment=(a,b)=>{
	let id1=parsesegmentid(a);
	let id2=parsesegmentid(b);
	if (!id1)throw "invalid id "+a;
	if (!id2)throw "invalid id "+b;

	let at1=bookname.indexOf(id1[0]);
	let at2=bookname.indexOf(id2[0]);
	if (at1!==at2) return at1-at2;

	for (var i=1;i<id1.length;i++){
		if (id1[i]!==id2[i]) return id1[i]-id2[i];
	}

	return a>b;
}
const packsegmentid=idarr=>{
	var prev=''
	let out=[];
	for (let id of idarr){
		let at=id.indexOf(SEGSEP);
		let bookid=id.substr(0,at);
		let sentenceid=id.substr(at+1);
		if (bookid==prev) {
			out.push(sentenceid);
		} else {
			out.push(id);
			prev=bookid;
		}
	}
	return out;
}
const packlinepage=pagelines=>{ //each page only has one line
	let onelinepage=true;
	for (var i=1;i<pagelines.length;i++) {
		if (pagelines[i]!==pagelines[i-1]+1) {
			onelinepage=false;
			break;
		}
	}
	return onelinepage?pagelines[0]:"["+pagelines.join()+"]";
}
const packcontinuouspage=idarr=>{
	var prev=''
	let out=[],pageline=0,pagelines=[];
	let pagecount=0,lastbk='',lastpg='';
	for (let id of idarr){
		let idobj=parsesegmentid(id);
		let bk=idobj[0]+idobj[1],page=idobj[4],sentenceid=idobj[5];
		
		if (lastbk!==bk && lastbk) {
			pagelines.push(pageline);//for last page
			out.push(lastbk+SEGSEP+packlinepage(pagelines));
			pagelines=[];
		}

		if (lastpg!==page) {
			pagelines.push(pageline);
		}

		pageline++;
		lastpg=page;
		lastbk=bk;
	}
	pagelines.push(pageline);//for last page
	
	out.push(lastbk+SEGSEP+packlinepage(pagelines));

	return out;
}

module.exports={comparesegment,parsesegmentid,
	packsegmentid,
	packcontinuouspage,
	SEGSEP,LANGSEP,LEVELSEP,
BOOKNAME_REGEXP}