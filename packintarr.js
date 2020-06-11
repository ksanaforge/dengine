const maxlen1=91
const maxlen2=8281	
const maxlen3=753571
const pack1=arr=>{
	let s="";
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen1) throw "exit boundary "+arr[i]
		let int=arr[i];
		if (isNaN(int)) int=0;
		s+=String.fromCharCode(int+0x20);
	}
	return s;
}
const pack2=arr=>{
	var s="";
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen2) {
			throw "exit boundary "+arr[i]
		}
		let int=arr[i];
		if (isNaN(int)) int=0;
		let i1,i2;
		i1=int % 91;
		int=Math.floor(int/91);
		i2=int % 91;
		s+=String.fromCharCode(i2+0x20)+String.fromCharCode(i1+0x20);
	}
	return s;
}
const pack3=arr=>{
	var s="";
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen3) throw "exit boundary "+arr[i]
		let int=arr[i];
		if (isNaN(int)) int=0;
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
const unpack2=str=>{
	let arr=[],i1,i2;
	const count=Math.floor(str.length/2);
	for (var i=0;i<count;i++) {
		i2=str.charCodeAt(i*3) -0x20;
		i1=str.charCodeAt(i*3+1) -0x20;
		arr.push(91*i2+i1 );
	}
	return arr;
}
const unpack1=str=>{
	let arr=[],i1,i2,i3;
	const count=Math.floor(str.length);
	for (var i=0;i<count;i++) {
		i1=str.charCodeAt(i*3) -0x20;
		arr.push( i1 );
	}
	return arr;
}
//variable  1or 3 bytes, maxlen2
const unpacksmallint=str=>{
	let arr=[],i1,i=0;
	while (i<str.length) {
		i1=str.charCodeAt(i) -0x20;
		if (i1==91) {
			i1+=(str.charCodeAt(i+1)-0x20)*91
			+(str.charCodeAt(i+2)-0x20);
			i+=2;
		}
		arr.push( i1 );
		i++;
	}
	return arr;
}


const packsmallint=(arr)=>{
	let s="";
	for (var i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen1) {
			s+="{"+pack2([arr[i]-91]);
			continue;
		}

		let int=arr[i];
		if (isNaN(int)) int=0;
		s+=String.fromCharCode(int+0x20);
	}
	return s;
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

/*
if (typeof process!=="undefined" && process.argv.length==2){
	const arr=[90,91,92,93];
	const s=packsmallint(arr);
	arr2=unpacksmallint(s);
	console.log(arr,arr2)
}
*/
//729,000
module.exports={
	test,pack1,pack2,pack3,unpack3,unpack1,unpack2,unpacksmallint,packsmallint
}