const isSyllable=s=>{
	const m=s.match(/[bcdghjklmnprstvyṅñṇḍṭḷṁṃŋ]*[aāiīuūeo][ṁṃ]?/i);
	return (m&&m[0]==s);
}
const syllabify=s=>{
	return s.split(/([bcdghjklmnprstvyṅñṇḍṭḷṁṃŋ]*[aāiīuūeo][ṁṃ]?)/i).filter(i=>i);
}

const isPaliword=s=>{
	const m=s.match(/[bcdghjklmnprstvyṅñṇḍṭḷṁṃŋaāiīuūeo]+/gi);
	return (m&&m[0]==s);
}
const expandrange=(from,to)=>{
	if (isNaN(to))return from;
	if (to>from)return to;
	if (to<10) {
		to+=from-from%10;
	} else if (to<100) {
		to+=from-from%100;
	} else if (to<1000) {
		to+=from-from%1000;
	} else {
		console.log("too big",to)
		throw " range error"+filename+sourcelinenumber;
	}
	return to;
}
/*
<p rend="gatha1">‘‘Sañcicca āpattiṃ āpajjati;</p>
<p rend="gatha2">Āpattiṃ parigūhati;</p>
<p rend="gatha3">Agatigamanañca gacchati;</p>
<p rend="gathalast">Ediso vuccati alajjipuggalo’’ti. (pari. 359) –</p>

<p rend="gatha">‘‘Sañcicca āpattiṃ āpajjati; Āpattiṃ parigūhati; 
Agatigamanañca gacchati; Ediso vuccati alajjipuggalo’’ti. (pari. 359) –</p>
*/
const palialpha='bcdghjklmnprstvyṅñṇḍṭḷṁṃŋaāiīuūeo';
module.exports={syllabify,isSyllable,isPaliword,palialpha,expandrange}