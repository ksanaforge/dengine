const {tokenize}=require("./tokenizer")
const concordancesearch=(db,word,texts)=>{
	for (var i=0;i<texts.length;i++){
		const tokens=tokenize(texts[i]);
		debugger
	}


}
module.exports={concordancesearch};