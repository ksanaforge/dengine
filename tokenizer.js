//const SPLITTER=/[\d\-.;_#~{}\[\]$()|@:\\*&/<>?! +,…«»“‘”—’]/g;
//SPLITTER=/[^a-z]/gi;
const TOKEN_REGEX=/[a-zāīūñṅṇŋṁṃḍṭḷ]+/ig
const TOKEN_CHARS="a-zāīūñṅṇŋṁṃḍṭḷ"
const tokenize=str=>{
	let tokens=[];
	str.replace(TOKEN_REGEX,(w)=>{
		tokens.push(w)
	})
	return tokens;
}

module.exports={
	tokenize,TOKEN_REGEX,TOKEN_CHARS
}