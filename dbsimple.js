/*
  support CAP by default
  bk     bookname in string
  bkseq  sequencial numbering of book

  numerical
  paging unit:  cscd , paranum, allow multiple in one book (multiple pn=1)
                physical page in pts.

  simplified building process, no need to output raw-txt
  easy to generate js directly from xml or json.

*/
'use strict';
const fs=require("fs");
const {packsmallint}=require("./packintarr")
const writetodisk=true,verbose=false;
const packpayload=(meta,arr_str)=>{
	var payload=arr_str;
	if (Array.isArray(arr_str)){
		payload=arr_str.join("\n");
	}
	payload=payload.replace(/\\/g,"\\\\").replace(/`/g,"\\`");
	var str='jsonp({ "meta":'+ JSON.stringify(meta) ;
	if (arr_str){
		str+=',"payload":\n`'+payload+"`";
	}
	str+="})";
	return str;
}

const createsegments=(lines,maxsegsize)=>{
	const out=[];
	let meta={segmentstart:[0],date:(new Date()).toISOString()};
	let currentsegment=[];
	let segmentsize=0;
	let segmentcount=0;
	const newsegment=(line)=>{
		out.push(currentsegment);
		currentsegment=[];
		meta.segmentstart.push(line);
		segmentcount++;
		segmentsize=0;
	}
	for (var i=0;i<lines.length;i++) {
		if (segmentsize>maxsegsize) newsegment(i);
		currentsegment.push(lines[i]);
		segmentsize+=lines[i].length;
	}
	newsegment(i);
	out.meta=meta;
	return out;
}

const writesegments=(dbname,field,type,outdir,lines,maxsegsize=128*1024)=>{
	const segments=createsegments(lines,maxsegsize);
	for (var i=0;i<segments.length;i++){
		let outfn=outdir+dbname+"."+(field?field+".":"")+type+"."+i+".js";
		const segmeta={name:dbname,segment:i,start:segments.meta.segmentstart[i]};
		if (field) segmeta.field=field;
		if (type) segmeta.type=type;
		const str=packpayload(segmeta,segments[i]);
		if (verbose) console.log("writing multifile",outfn,"length",str.length);
		if (writetodisk) fs.writeFileSync( outfn , str,"utf8");
	}
	return segments.meta.segmentstart;
}

const addline=function(t){
	const B=this;
	B.linecount++;
	B.pagelinecount++;
	B.txt.push(t);
}
const addpage=function(page){
	const B=this;
	B.pageline[page]=B.pagelinecount;
	//if (B.pagelinecount>B.maxlineofpage) {
	//	B.maxlineofpage=B.pagelinecount;
	//	B.maxlineofpageat=B.bk+":"+page;
	//}
	B.pagelinecount=0;
}
const addbook=function(bk){
	const B=this;
	
	B.booknames.push(bk);
	B.bookstarts.push(B.linecount);
	const str=packsmallint(B.pageline);
	B.pagelines.push(str);
	B.pageline=[];
	B.bk=bk;
}
const done=function(payload,extra){
	const B=this;
	let dbobj={ name:B.opts.name,date:(new Date).toISOString()
		,ver:2};
	
	if (B.opts.withtoc) dbobj.withtoc=true;
	dbobj.txtstarts=writesegments(B.opts.name,"","txt",B.opts.outdir,B.txt);
	dbobj.booknames=B.booknames;
	dbobj.bookstarts=B.bookstarts;
	dbobj.pagelines=B.pagelines;


	if (Object.keys(extra||{}).length) dbobj.extra=extra;

	const outstr=packpayload(dbobj,payload||[]);
	const outfn=B.opts.outdir+B.opts.name+".js";

	if (writetodisk) fs.writeFileSync(outfn, outstr ,"utf8" );
}
const createbuilder=(opts)=>{
	if (!opts.name){
		throw "must give a name"
	}
	const builder={
			linecount:0,
			pagelinecount:0,
			//maxlineofpage:0,
			//maxlineofpageat:0,
			pageline:[],  //line count of this book
//write to file
			txt:[],       // line of text
			booknames:[], //name of books
			bookstarts:[0], //starting line# of each book
			pagelines:[], //2D array ,line count of all books
			opts
		}
	if (!opts.outdir)opts.outdir=opts.name+'/';
	builder.addbook=addbook.bind(builder);
	builder.addpage=addpage.bind(builder);
	builder.addline=addline.bind(builder);
	builder.done=done.bind(builder);
	return builder;
}

module.exports={createbuilder}