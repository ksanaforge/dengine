const {tokenize}=require("./tokenizer");
const stopwords={the:true,and:true,that:true,this:true,with:true,for:true,are:true,
	has:true,have:true,they:true,you:true,then:true,from:true,was:true,his:true,but:true,them:true,
	had:true,which:true,would:true,why:true,been:true,did:true,
	how:true,when:true,what:true,will:true,who:true,were:true,him:true,your:true,
	//And:true,The:true,This:true,They:true,When:true,Then:true,But:true,
kho:true,hoti:true};

const buildindex=(arr,opts={})=>{
	const invert={},doclen=[];
	let wordcount=0;
	for (var i=0;i<arr.length;i++){
		var tokens=tokenize(arr[i].toLowerCase());
		doclen.push(tokens.length);
		wordcount+=tokens.length;
		tokens=tokens.filter(item=>item.length>2);
		for (tk of tokens) {
			if (stopwords[tk])continue;
			if (!invert[tk]) invert[tk]=[];
			posting=invert[tk];
			//repeat posting if termfreq is needed
			if (posting[posting.length-1]!=i || opts.termfreq){
				posting.push(i);
			}
		}
	}
	const out=[];
	for (var key in invert){
		out.push([key, invert[key] ]);
	}
	out.sort((a,b)=>b[1].length-a[1].length);
	return {inverted:out,doclen,wordcount};
}
module.exports={
	buildindex
}