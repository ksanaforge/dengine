const {tokenize,stopwords}=require("./tokenizer")
const concordancesearch=(db,word,field,texts)=>{
	const scores={};
	let power=0;
	for (let i=0;i<texts.length;i++){
		const tokens=tokenize(texts[i]);
		for (let j=0;j<tokens.length;j++) {
			let tk=tokens[j].toLowerCase();
			if (tk==word) power=1;

			if (!scores[tk])scores[tk]=0;
			scores[tk]+=power;
			power=power*0.8;
		}

		for (let j=tokens.length-1;j>=0;j--) {
			let tk=tokens[j].toLowerCase();
			if (tk==word) power=1;
			scores[tk]+=power;
			power=power*0.8;
		}
	}
	let out=[];
	for (let token in scores) {
		if (stopwords[token] || token.length<3)continue;
		let score=scores[token];
		if (score) out.push([token,score]);
	}
	out.sort((a,b)=>b[1]-a[1]);
	return out;
}
module.exports={concordancesearch};