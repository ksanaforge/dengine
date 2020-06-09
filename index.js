const {comparesegment,parsesegmentid,SEGSEP,LEVELSEP,LANGSEP}=require("./segment");
const {buildindex}=require("./indexer");
const {parseTofind}=require("./search");
const {createpages}=require("./paging");
const bsearch=require("./bsearch")
const {build,buildsimple,packpayload,writeExtra}=require("./builder");
const {getTocChildren,buildToc}=require("./toc");
const {parseCAP}=require("./capaddr")
const {syllabify,isSyllable,isPaliword,palialpha}=require("./paliutil");


const {tokenize,TOKEN_REGEX}=require("./tokenizer");
const {open,openSearchable,fetchidarr,readpage,findtokens,searchtokens,fetchpostings,
	getshorthand,getbookrange,search,concordance,setlogger
,openSync,getdbbookname,readlines}=require("./jsdb");

const {createbuilder}=require("./dbsimple")
const API={
	comparesegment,parsesegmentid,LANGSEP,SEGSEP,TOKEN_REGEX,LEVELSEP,
	buildindex,createpages,build,writeExtra,
	open,openSearchable,fetchidarr,readpage,
	findtokens,searchtokens,search,parseTofind,
	packintarr:require("./packintarr"),
	fetchpostings,getbookrange,tokenize,
	concordance,getshorthand,
	setlogger,packpayload,
	getTocChildren,buildToc,getdbbookname,bsearch,
	readlines,
	parseCAP,
	syllabify,isSyllable,isPaliword,palialpha,
//for node only
	openSync,createbuilder
}
if (typeof window!=="undefined"){
	window.Dengine=API;
}
module.exports=API;