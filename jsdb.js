'use strict';
const Db=require("./db");
const {concordance}=require("./concordance")
let log=()=>{console.log.call(arguments)};
let dbpool={};
let verbose=false;
const loadscript=(files)=>{
	let f=files;
	if (typeof files=="string") f=[files];
	f.forEach(file=>{
		const script=document.createElement("script");
		script.setAttribute("src", file);
		document.getElementsByTagName("body")[0].appendChild(script);		
	});	
}
const jsonp=(data)=>{
	if (data.meta && data.meta.name){
		const name=data.meta.name;
		const db=dbpool[name];
		if (!db) {
			dbpool[name]=new Db( Object.assign(data.meta,{segids:data.payload}));
		} else {
			if (verbose) console.log("set data",data.meta)
			db.setdata(data.meta,data.payload);
		}
	}
}
var opendbTimer=0,opentrycount=0;
const open=(name,cb)=>{
	if (dbpool[name]){
		cb(dbpool[name]);
		return;
	}
	loadscript(name+"/"+name+".js");

	clearInterval(opendbTimer);
	opentrycount=0;
	opendbTimer=setInterval( ()=>{
		if (dbpool[name]) {
			clearInterval(opendbTimer);
			cb(dbpool[name]);
		}
		if (opentrycount>10) clearInterval(opendbTimer);
		opentrycount++;
	},50);
}

var tokenTimer=0,tokentrycount=0;
const loadTokens=(db,cb)=>{ 
	if (db.issearchready()){
		cb(db)
		return;
	}

	clearInterval(tokenTimer);
	tokentrycount=0;
	const fields=db.fields();
	const files=[];
	for (let field of fields){
		if (!db.gettokens(field)){
			files.push(db.basedir+"."+field+".token.js");
			//files.push(db.basedir+"."+field+".doclen.js");			
		}
	}

	tokenTimer=setInterval(()=>{
		if (db.issearchready(fields)) {
			clearInterval(tokenTimer);
			cb(db);
		}
		if (tokentrycount>20) clearInterval(tokenTimer);
		tokentrycount++;

	},100);

	loadscript(files);
}

const openSearchable=(name,field,cb)=>{
	open(name,db=>{
		if (typeof field=="function"){
			cb=field;
			field=db.fields;
		}
		if (db.issearchready(field)){
			cb(db);
		} else {
			loadTokens(db,cb);
		}
	});
}

const findtokens=(dbname,patterns,cb)=>{
	log("findtokens");
	openSearchable(dbname, db=>{
		let pat ,len=0;
		for (var term in patterns){
			if (term.length>len) {
				pat=patterns[term];
				len=term.length;
			}
		}
		log("guesslanguage");
		const lang=db.guesslanguage(pat);
		
		const tokens=db.findtokens(lang,patterns);
		log("found token");
		if (verbose) console.log("found token",tokens);
		cb(tokens,db,lang);
	});	
}
var postingTimer=0,postingtrycount=0;
const fetchpostings=(dbname,field,tokens,cb)=>{
	openSearchable(dbname,field, db=>{
		if (db.ispostingready(field,tokens)){
			cb(db.getpostings(field,tokens),db);
		} else {
			clearInterval(postingTimer);
			postingtrycount=0;
			const files=db.filesFromTokens(field,tokens);
			postingTimer=setInterval(()=>{
				if (dbpool[dbname]) {
					if (db.ispostingready(field,tokens)){
						clearInterval(postingTimer);
						cb(db.getpostings(field,tokens),db);
					}
				}
				if (postingtrycount>30) clearInterval(postingTimer);
				postingtrycount++;
			},100);
			loadscript(files);
		}
	});
};

var readTimer=0,readtrycount=0;
const readpage=(dbname,opts,cb)=>{
	openSearchable(dbname,db=>{
		let idseqarr=db.getneighbour(opts.prefix,opts);
		if (!idseqarr) {
			cb(null,db);
			return;
		}
		clearInterval(readTimer);
		readtrycount=0;
		const files=db.filesFromSeq( idseqarr[1] );
		const idarr=idseqarr[0];

		readTimer=setInterval(()=>{
			if (db.istextready(idarr)){
				clearInterval(readTimer);
				cb(db.fetch(idarr),db);
			}
			if (readtrycount>30) {
				console.warn("giveup cannot load page",opts.prefix);
				clearInterval(fetchTimer);
			}
			fetchtrycount++;

		},50);

		loadscript(files);
	});	
}
var fetchTimer=0,fetchtrycount=0;
const fetchidarr=(dbname,idarr,cb)=>{
	open(dbname,db=>{
		if (verbose) console.log("fetch idarr open");
		if (db.istextready(idarr)){
			if (verbose) console.log("text ready 1");
			cb(db.fetch(idarr),db);
		} else {
			clearInterval(fetchTimer);
			fetchtrycount=0;
			const files=db.filesFromId(idarr);

			fetchTimer=setInterval(()=>{
				if (db.istextready(idarr)){
					if (verbose) console.log("text ready 2");
					clearInterval(fetchTimer);
					cb(db.fetch(idarr) ,db);
				} else {
					if (db.deflated()){
						loadTokens(db,db=>{
							if(db.istextready(idarr)){
								if (verbose) console.log("text ready 3");
								cb( db.fetch(idarr),db);
							}
						})
					}
				}
				if (fetchtrycount>50) {
					console.warn("giveup cannot open db",dbname);
					clearInterval(fetchTimer);
				}
				fetchtrycount++;

			},150);

			if (verbose) console.log("load text files",files);
			loadscript(files);
		}

	});
}



const {simplerank,weightrank}=require("./search");
var search=(dbname,field,tokens,opts,cb)=>{
	if (typeof opts=="function"){
		cb=opts;
		opts={};
	}
	tokens=JSON.parse(JSON.stringify(tokens));
	const maxtermtoken=opts.maxtermtoken||5;
	let toload=[],stopwords={};
	for (var key in tokens){
		tokens[key].splice(maxtermtoken);

		for (var j=0;j<tokens[key].length;j++){
			let tk=tokens[key][j];
			if (tk[1]<0) {
				const db=dbpool[dbname]; //unknown seq of token, sentence search
				tk[1]=db.tokenseq(tk[0],field);
			}
			if (tk[1]<0)stopwords[key]=true;;
		}
		tokens[key]=tokens[key].filter( item=>item[1]>=0 );
		if (tokens[key].length>0){
			toload=toload.concat(tokens[key]);
		}
	}
	if (opts.logger) opts.logger("fetching postings. "+toload.length);
	fetchpostings(dbname,field,toload,(postings,db)=>{
		if (opts.logger) opts.logger("posting fetched.");
		let tokenpostings={};
		for (var key in tokens){
			let postings=[];
			for (var i in tokens[key]) {
				if (stopwords[i])continue;
				postings.push(tokens[key][i]);
			}
			tokenpostings[key]=postings;
		}
		if (opts.logger) opts.logger("ranking");
		cb(weightrank(db,field,tokenpostings,opts),db);
	})
}
const getbookrange=(dbname,prefix,cb)=>{
	open(dbname,db=>{
		let bookranges=db.findbook(prefix);
		cb(bookranges,db);
	})
}
const setlogger=logfunc=>{
	log=logfunc;
}
if (typeof window !=="undefined") {
	window.jsonp=jsonp;
}
module.exports={
	open,fetchidarr,readpage,findtokens,concordance,
	getbookrange,fetchpostings,search,setlogger
}