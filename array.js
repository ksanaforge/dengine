const intersect=(a, b)=>{
  let ai=0, bi=0;
  let result = [];

  while( ai < a.length && bi < b.length ) {
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else {/* they're equal */
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }
  return result;
}
module.exports={intersect};