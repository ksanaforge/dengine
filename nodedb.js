/* open jsdb with node, sync mode*/
const fs=require("fs");
const {jsonp,getdbfrompool}=require("./jsdb");

const loadscript=files=>{
	if (!Array.isArray(files)) files=[files];
	files.forEach(file=>{
		const content=fs.readFileSync(file,"utf8");
		eval(content);
	})
}
const fetchSync=function(idarr){
	const db=this;
	if (!db.istextready(idarr)){
		db.filesFromId(idarr).forEach(file=>loadscript(file));
	}
	return this.fetch(idarr);
}
const loadsearchable=function(db){
	const fields=db.getfields();
	const files=[];
	for (let field of fields){
		if (!db.gettokens(field)){
			const fn=db.basedir+"."+field+".token.js";
			if (fs.existsSync(fn))files.push(fn);
		}
	}
	loadscript(files);
}
const openSync=(name,opts)=>{
	if (typeof opts=="undefined") opts={};
	loadscript(name+"/"+name+".js");
	const db= getdbfrompool(name);
	if (!db)return null;

	if (!opts.textonly) {
		loadsearchable(db);
	}
	if (db.withtoc() && !db.gettoc()) loadscript(db.basedir+".toc.js");
	if (db.withxref() && !db.getxref()) loadscript(db.basedir+".xref.js");

	db.fetchSync=fetchSync.bind(db);
	return db;
}
module.exports={openSync}