const {comparesegment,parsesegmentid,LANGSEP}=require("./segment");
const {buildindex}=require("./indexer");
const {parseTofind}=require("./search");
const {createpages}=require("./paging");
const {build}=require("./builder");
const {tokenize,TOKEN_REGEX}=require("./tokenizer");
const {open,fetchidarr,readpage,findtokens,searchtokens,fetchpostings,
	getbookrange,search,setlogger}=require("./jsdb");

const API={
	comparesegment,parsesegmentid,LANGSEP,TOKEN_REGEX,
	buildindex,createpages,build,open,fetchidarr,readpage,
	findtokens,searchtokens,search,parseTofind,
	packintarr:require("./packintarr"),
	fetchpostings,getbookrange,tokenize,
	setlogger
}
if (typeof window!=="undefined"){
	window.Dengine=API;
}
module.exports=API;