const {createCAPobj,stringify,getline,floor,nextp,prevp}=require("./cap");

const fromx0=x0=>{
	seg=db.pagefromx0(str);
	return seg
}
const pofx=cap=>{
	const arr=cap.db.getpageline(cap.bkseq);
	let prev=0,l=0;
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>cap.bk0) {
			if (i==0) return {p:0,x:cap.bk0,px:arr[1]-arr[0]};
			return {p:i, x:cap.bk0-arr[i-1], px:arr[i]-arr[i-1] };
		}
	}
	let px=1;
	const nextarr=cap.db.getpageline(cap.bkseq+1)
	if (nextarr) {
		const nextbookstart=cap.db.bookstarts[cap.bkseq];
		px=nextbookstart-arr[arr.length-1];
	} else {
		const thisbookstart=cap.db.bookstarts[cap.bkseq-1];
		px=cap.db.totalline()-thisbookstart-arr[arr.length-1];
	}
	const p=arr.length-1;
	const x=cap.bk0-arr[arr.length-1];
	return {p,x,px};
}

const CAPx0=cap=>{
	let bookstart=cap.db.bookstarts[cap.bkseq];
	let x=cap.x;
	let p=cap.p;
	if (p==-1) {
		let bk0=cap.bk0; //resolved by n:n format
		if (bk0==-1) bk0=0;
		return bookstart+bk0+x;
	}
	const parr=cap.db.getpageline(cap.bkseq);

	if (p>parr.length)	p=parr.length;

	let pstart=0;   //若p=0, 則起始行必為0
	if (p!=0) {
		if (p<1) p=1;
		//while (p&&p<parr.length && !parr[p]) p++;//新版無跳頁，會重復前個數字
		pstart=parr[p-1]; 	 //pageline[i-1]是p=i 的起始行。	
	}
	x+=pstart;
	x0=bookstart+x;
	return x0;
}
const parseCAP=(str,db)=>{
	let out={};
	if (typeof str=='number') {//absolute jsdb line number
		const obj=db.pagefromx0(str);
		obj.bk=db.booknames[obj.bkseq];
		obj.x0=str;
		obj.db=db;
		out=createCAPobj(obj);
	} else if (typeof str=='string') {
		const at=str.indexOf("_");
		if (at==-1) throw "invalid address "+str;
		const arr=[];

		str.substr(at).replace(/([a-z_]\d+)/g,(m,m1)=>arr.push(m1));

		let bk=str.substr(0,at);
		let bkseq=0;
		if (parseInt(bk).toString()===bk) {
			bkseq=parseInt(bk);
			bk=db.booknames[bkseq];
		} else {
			bkseq=db.booknames.indexOf(bk);
		}
		const o={bk,bkseq};
		arr.forEach(item=>{
			const k=item[0];
			const v=parseInt(item.substr(1))||0;
			o[k]=v;
			if (k=="z" && v==0) o[k]=-1;//ends with z without number
		});
		out=createCAPobj(o);

		out.db=db;
		out.x0=CAPx0(out);
		out.bk0=out.x0-db.bookstarts[out.bkseq];
		const pp=pofx(out);
		out=Object.assign(out,pofx(out));
	} else throw "invalid parsecap param"
 	

	out.bkx=out.bkseq+":"+(out.bk0+1);
	out.prevp=prevp.bind(out);
	out.nextp=nextp.bind(out);
	out.floor=floor.bind(out);
	out.stringify=stringify.bind(out);
	out.getline=getline.bind(out);

	out.stringify=stringify.bind(out)
	return out;
}
module.exports=parseCAP;