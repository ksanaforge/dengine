const maxlen2=8281	
const maxlen3=753571

const pack3=arr=>{
	var s="";
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen3) {
			throw "exit boundary "+arr[i]
		}
		let int=arr[i];
		let i1,i2,i3;
		i1=int % 91;
		int=Math.floor(int/91);
		i2=int % 91
		i3=Math.floor(int/91);

		s+=String.fromCharCode(i3+0x20)+String.fromCharCode(i2+0x20)+String.fromCharCode(i1+0x20);
	}
	return s;
}

const unpack3=str=>{
	let arr=[],i1,i2,i3;
	const count=Math.floor(str.length/3);
	for (var i=0;i<count;i++) {
		i3=str.charCodeAt(i*3) -0x20;
		i2=str.charCodeAt(i*3+1) -0x20;
		i1=str.charCodeAt(i*3+2) -0x20;
		arr.push( 91*91*i3 +91*i2+i1 );
	}
	return arr;
}
test=()=>{
	var arr=[];
	for (i=100000;i< maxlen3-1000;i+=1000){
		arr.push(i);
	}
	var s=pack3(arr);
	var out=unpack3(s);
	
	for (var i=0;i<out.length;i++) {
		if (out[i]!==arr[i]) {
			throw "test fail at"+i
		}
	}
	console.log("arr length"+JSON.stringify(arr).length)
	console.log("pack length"+s.length)
}
//
//729,000
module.exports={
	test,pack3,unpack3
}