//const SPLITTER=/[\d\-.;_#~{}\[\]$()|@:\\*&/<>?! +,…«»“‘”—’]/g;
//SPLITTER=/[^a-z]/gi;
const stopwords={the:true,and:true,that:true,this:true,with:true,for:true,are:true,
	has:true,have:true,they:true,you:true,then:true,from:true,was:true,his:true,but:true,them:true,
	had:true,which:true,would:true,why:true,been:true,did:true,
	how:true,when:true,what:true,will:true,who:true,were:true,him:true,your:true,
	//And:true,The:true,This:true,They:true,When:true,Then:true,But:true,
	don:true,doesn:true,not:true,
kho:true,hoti:true};

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
	stopwords,tokenize,TOKEN_REGEX,TOKEN_CHARS
}