const B2_MAX = 17*85
const B2_REGEX =/[\x0E-\x1F][%-z]/g
const BL_TOKEN_REGEX=/ ([a-zāīūñṅṇŋṁṃḍṭḷ]+)/ig //with leading blank
const pack2b=i=>{
	if (i>B2_MAX) {
		throw "exceed max ,"+i
	}
	return String.fromCharCode((Math.floor(i/85)+0x0e))+
	String.fromCharCode( i%85 + 0x25 );
}
const unpack2b=str=>{
	let i= (str.charCodeAt(0)-0x0e)*85+(str.charCodeAt(1)-0x25);
	if (i>B2_MAX) throw "invalid string "+str
	return i;
}

const deflate=(text,freqtoken)=>{
	return text.replace(BL_TOKEN_REGEX,(m,m1)=>{
		let seq=freqtoken[m1];
		return (typeof seq!=="undefined")? pack2b(seq) :m
	});
}

const inflate=(text,freqtoken)=>{
	return text.replace(B2_REGEX,m=>{
		const i=unpack2b(m);
		return " "+freqtoken[i];
	});
}
const commontokens=tokenarr=>{
	let freqtoken=[];
	for (var j=0;j<B2_MAX;j++){
		freqtoken.push(tokenarr[j]);
	}
	return freqtoken;
}


module.exports={commontokens,deflate,inflate}