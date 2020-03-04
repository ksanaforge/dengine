'use strict';
const {buildindex}=require("./indexer");
const {createpages}=require("./paging");
const {pack3}=require("./packintarr");
const {SPLITTER}=require("./tokenizer");
const {commontokens,deflate}=require("./textcompress");
const {packsegmentid,LANGSEP}=require("./segment");
const fs=require("fs");
const verbose=true;
const writetodisk=true;
const blurb={};
const packstr=(meta,arr_str)=>{
	var payload=arr_str;
	if (Array.isArray(arr_str)){
		payload=arr_str.join("\n");
	}

	payload=payload.replace(/\\/g,"\\\\").replace(/`/g,"\\`");

	var str='jsonp({ "meta":'+ JSON.stringify(meta) ;
	if (arr_str){
		str+=',"payload":`'+payload+"`";
	}
	str+="})";
	return str;
}

const multifile=(dbname,field,type,outdir,lines,maxpagesize=128*1024)=>{
	const pages=createpages(lines,maxpagesize);
	for (var i=0;i<pages.length;i++){
		let outfn=outdir+dbname+"."+(field?field+".":"")+type+"."+i+".js";
		var meta={name:dbname,page:i,start:pages.meta.pagestart[i]};
		if (field) meta.field=field;
		if (type) meta.type=type;
		const str=packstr(meta,pages[i]);
		if (verbose) console.log("writing multifile",outfn,"length",str.length);
		if (writetodisk) fs.writeFileSync( outfn , str,"utf8");
	}
	return pages.meta.pagestart;
}


const build=(meta,raw)=>{
	if (!meta.outdir)meta.outdir="";
	const fields=[],keys=[],tokenss=[],postingss=[],doclens=[],wordcounts=[];
	let txt=[];
	let keycheck={};
	let txtlengths=[];
	for (var j=0;j<meta.fields.length;j++){
		fields.push([]);
		txtlengths.push(0);
	}

	for (var i=0;i<raw.length;i++){
		let line=raw[i];
		
		const at=line.indexOf(",");
		let key=line.substr(0,at);

		if (key.indexOf(":")==-1) {//blurb
			key=key.replace(/^pli-tv-/,"").replace(/^bu-vb-/,"").replace(/^bi-vb-/,"i");
			blurb[key]=line.substr(at+1).replace(LANGSEP,"");
			continue;	
		}

		if (!keycheck[key]) {
			keycheck[key]=true;
		} else {
			console.error("repeated key",key);
		}

		keys.push(key);
		const content=line.substr(at+1).split(LANGSEP);

		txt.push(line.substr(at+1));
		let deflated="";
		for (var j=0;j<content.length;j++){
			fields[j].push(content[j]);
			txtlengths[j]+=content[j].length;
		}
	}
	

	for (j=0;j<fields.length;j++){
		const {inverted,doclen,wordcount}=buildindex(fields[j],{termfreq:true});
		const tokens=[],postings=[];

		for (var i=0;i<inverted.length;i++) {
			tokens.push(inverted[i][0]);
			postings.push(pack3(inverted[i][1]));
		}

		tokenss.push(tokens);
		postingss.push(postings);
		doclens.push(doclen);
		wordcounts.push(wordcount);
	}

	let outfn="",str="",idxstarts=[];
	for (var i=0;i<fields.length;i++){
		let pagestart=multifile(meta.name,meta.fields[i],"idx",meta.outdir,postingss[i]);
		idxstarts.push(pagestart);
		postingss[i]=null; //release some memory

		let obj={name:meta.name,field:meta.fields[i],wordcount:wordcounts[i],type:"token"};
		str=packstr(obj,tokenss[i]);
		outfn=meta.outdir+meta.name+"."+meta.fields[i]+".token.js";
		if (verbose) console.log("writing tokens",outfn,"length",str.length);
		if (writetodisk) fs.writeFileSync( outfn , str,"utf8");

		obj={name:meta.name,field:meta.fields[i],type:"doclen"};
		str=packstr(obj,pack3(doclens[i]));
		outfn=meta.outdir+meta.name+"."+meta.fields[i]+".doclen.js";
		if (verbose) console.log("write doclen,length",str.length);
		if (writetodisk) fs.writeFileSync(outfn, str ,"utf8" );
	}

	let txtdeflated=true;
	let beforesize=0,aftersize=0;
	if (txtdeflated) {
		if (verbose) console.log("compressing text");
		let freqtokens=[];
		for (var i=0;i<fields.length;i++){
			let commontoken=commontokens(tokenss[i]);
			let freqtoken={};
			for (var j=0;j<commontoken.length;j++){
				freqtoken[commontoken[j]]=j;
			}
			freqtokens.push(freqtoken);
		}
		const out=[];
		let ratio,lastratio=0;
		for (var i=0;i<txt.length;i++) {
			if (verbose) {
				ratio= Math.floor((i/txt.length).toFixed(2)*100);
				if (lastratio!==ratio) {
					process.stdout.write(ratio+"%\r");
				}
				lastratio=ratio;
			}
			let txts=txt[i].split(LANGSEP);
			let deflatetext=[];
			for (var j=0;j<txts.length;j++) {
				//compress words has leading blank
				let deflatedline=deflate(" "+txts[j],freqtokens[j]).trim();
				beforesize+=txts[j].length;
				aftersize+=deflatedline.length;
				deflatetext.push(deflatedline)
			}
			out.push(deflatetext.join(LANGSEP));
		}
		txt=out;
	}
	if (verbose&&txtdeflated) {
		console.log("before",beforesize,"after compress",aftersize,"ratio",
			(aftersize/beforesize).toFixed(2));
	}
	if (verbose) console.log("writing text");
 	const txtstarts=multifile(meta.name,"","txt",meta.outdir,txt);


	outfn=meta.outdir+meta.name+".js";
	let segids=packsegmentid(keys);

	var dbobj={ name:meta.name,fields:meta.fields,date:(new Date).toISOString()};
	if (txtdeflated) dbobj.txtdeflated=true;
	dbobj.txtstarts=txtstarts;
	dbobj.idxstarts=idxstarts;
	dbobj.txtlengths=txtlengths; // for calculating average line of txt
	dbobj.blurb=blurb;


	str= packstr(dbobj,segids);
	if (verbose) console.log("write main file,length",str.length);
	if (writetodisk) fs.writeFileSync(outfn, str ,"utf8" );
}
module.exports={build}