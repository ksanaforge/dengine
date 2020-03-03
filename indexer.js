const {tokenize,stopwords}=require("./tokenizer");


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
	//alphabetically
	out.sort(function(a,b){return (a[0]==b[0])?0:((a[0]>b[0])?1:-1)});

	//length of posting
	//out.sort((a,b)=>b[1].length-a[1].length);
	return {inverted:out,doclen,wordcount};
}
module.exports={
	buildindex
}