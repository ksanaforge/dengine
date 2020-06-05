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

/*
<p rend="gatha1">‘‘Sañcicca āpattiṃ āpajjati;</p>
<p rend="gatha2">Āpattiṃ parigūhati;</p>
<p rend="gatha3">Agatigamanañca gacchati;</p>
<p rend="gathalast">Ediso vuccati alajjipuggalo’’ti. (pari. 359) –</p>

<p rend="gatha">‘‘Sañcicca āpattiṃ āpajjati; Āpattiṃ parigūhati; 
Agatigamanañca gacchati; Ediso vuccati alajjipuggalo’’ti. (pari. 359) –</p>
*/
const palialpha='bcdghjklmnprstvyṅñṇḍṭḷṁṃŋaāiīuūeo';
module.exports={syllabify,isSyllable,isPaliword,palialpha}