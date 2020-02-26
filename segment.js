'use strict';
const bookname=[
'pli-tv-bu-pm_root-pli-ms',
'pli-tv-bu-vb-pj',
'pli-tv-bu-vb-ss',
'pli-tv-bu-vb-ay',
'pli-tv-bu-vb-np',
'pli-tv-bu-vb-pc',
'pli-tv-bu-vb-pd',
'pli-tv-bu-vb-sk',
'pli-tv-bu-vb-as',
'pli-tv-bi-pm_root-pli-ms',
'pli-tv-bi-vb-pj',
'pli-tv-bi-vb-ss',
'pli-tv-bi-vb-np',
'pli-tv-bi-vb-pc',
'pli-tv-bu-vb-as',
'pli-tv-kd',
'pli-tv-pvr',

 "dn","mn","sn","an","dhp","thag","thig"];

const BOOKNAME_REGEXP=/([a-z\-\.]+)(\d*)/
const SEGSEP=":";
const LEVELSEP=".";
const LANGSEP="|||"
const parsesegmentid= id=>{
	let obj=[];

	var at=id.indexOf(":");
	if (at==-1) return [id,0,0,0];

	const fn=id.substr(0,at);
	const para=id.substr(at+1);
	const ch=fn.split(".");
	const pr=para.split(".");

	let m=ch[0].match(BOOKNAME_REGEXP);
	obj[0]=m[1];
	obj[1]=m[2];
	obj[2]=ch[1];
	for (var i=0;i<pr.length;i++){
		obj[i+3]=pr[i];
	}
	for (var i=1;i<obj.length;i++) {
		const int=parseInt(obj[i]);
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

module.exports={comparesegment,parsesegmentid,packsegmentid,SEGSEP,LANGSEP,LEVELSEP,
BOOKNAME_REGEXP}