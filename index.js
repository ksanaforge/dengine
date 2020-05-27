const {comparesegment,parsesegmentid,SEGSEP,LEVELSEP,LANGSEP}=require("./segment");
const {buildindex}=require("./indexer");
const {parseTofind}=require("./search");
const {createpages}=require("./paging");
const {build,packpayload,writeExtra}=require("./builder");
const {getTocChildren,buildToc}=require("./toc");

const {tokenize,TOKEN_REGEX}=require("./tokenizer");
const {open,openSearchable,fetchidarr,readpage,findtokens,searchtokens,fetchpostings,
	getshorthand,getbookrange,search,concordance,setlogger
,openSync,getdbbookname}=require("./jsdb");

const API={
	comparesegment,parsesegmentid,LANGSEP,SEGSEP,TOKEN_REGEX,LEVELSEP,
	buildindex,createpages,build,writeExtra,
	open,openSearchable,fetchidarr,readpage,
	findtokens,searchtokens,search,parseTofind,
	packintarr:require("./packintarr"),
	fetchpostings,getbookrange,tokenize,
	concordance,getshorthand,
	setlogger,packpayload,
	getTocChildren,buildToc,getdbbookname,

//for node only
	openSync
}
if (typeof window!=="undefined"){
	window.Dengine=API;
}
module.exports=API;