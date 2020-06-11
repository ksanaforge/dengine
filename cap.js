const createCAPobj=(obj,newvalues)=>{
	const def={bk:'', //book name 
		bkseq:0,
		_:0 ,  //paranum group, most book has only one.
		p:-1 ,  //paranum -1=not resolved
		x:0,   //line offset from paranum, paranum==0 from beginning of book
		       //line==1 , point to end of first line, begin of next line
		y:0,  //syllabus from begining of line
		z:0,  //syllable count ,if==-1, point to a complete word
		x0:0, //absolute linecount
		bk0:-1, //line count from this book
		px:0,  //total line of this p
		       // x0-x+px   ==> first line of next p
		       // x0-x      ==> first line of this p
		w:0    // 0 system to decide how many lines
		       // 1 only fetch this line
		       // 2 fetch one more line (even div 2 )
		       // 3 fetch upper one line and lower one line
		       // 4 fetch two more lines (total 3)
	};

	const out=Object.assign(def,obj);
	
	for (var i in newvalues) {
		if (out.hasOwnProperty(i)) {
			out[i]=newvalues[i];
		}
	}

	
	return out;
}


const stringify=function(){
	const cap=this;
	let bk=cap.bk;
	let o=bk+"_";
	if (cap._) o+=cap._;
	if (cap.p) o+='p'+cap.p;
	if (cap.w) o+='w'+cap.w;
	if (cap.x||cap.p==0) o+='x'+cap.x;
	if (cap.y) o+='y'+cap.y;
	if (cap.z==-1) o+='z';
	else if (cap.z>0) o+='z'+cap.z;
	return o;
}
const floor=function(){ //這一頁的開頭的絕對行數
	const cap=this;
	if (cap.x) {
		cap.x0-=cap.x;
		cap.bk0-=cap.x;
		cap.x=0;
	}
	return cap.x0;
}

const getline=function(seq){
	const cap=this;
	seq=seq||cap.x0;
	return cap.db().getline(seq);
}
module.exports={createCAPobj,stringify,floor,getline}