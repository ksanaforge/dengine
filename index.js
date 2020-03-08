const {comparesegment,parsesegmentid,SEGSEP,LANGSEP}=require("./segment");
const {buildindex}=require("./indexer");
const {parseTofind}=require("./search");
const {createpages}=require("./paging");
const {build,packpayload}=require("./builder");

const {tokenize,TOKEN_REGEX}=require("./tokenizer");
const {open,fetchidarr,readpage,findtokens,searchtokens,fetchpostings,
	getshorthand,getbookrange,search,concordance,setlogger}=require("./jsdb");


const API={
	comparesegment,parsesegmentid,LANGSEP,SEGSEP,TOKEN_REGEX,
	buildindex,createpages,build,open,fetchidarr,readpage,
	findtokens,searchtokens,search,parseTofind,
	packintarr:require("./packintarr"),
	fetchpostings,getbookrange,tokenize,
	concordance,getshorthand,
	setlogger,packpayload
}
if (typeof window!=="undefined"){
	window.Dengine=API;
}
module.exports=API;