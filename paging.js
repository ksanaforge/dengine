const createpages=(lines,maxpagesize)=>{
	const out=[];
	let meta={pagestart:[0],date:(new Date()).toISOString()};
	let currentpage=[];
	let pagesize=0;
	let pagecount=0;

	const newpage=(line)=>{
		out.push(currentpage);
		currentpage=[];
		meta.pagestart.push(line);
		pagecount++;
		pagesize=0;
	}

	for (var i=0;i<lines.length;i++) {
		if (pagesize>maxpagesize) {
			newpage(i);
		}
		
		currentpage.push(lines[i]);
		pagesize+=lines[i].length;
	}

	newpage(i);

	out.meta=meta;

	return out;
}

module.exports={
	createpages
}