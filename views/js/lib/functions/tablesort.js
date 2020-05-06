export default class tableSort {
    static sortTable(table, col, reverse) {
        var tb = table.tBodies[0], // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
            tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
            i;
        reverse = -((+reverse) || -1);
        tr = tr.sort(function (a, b) { // sort rows
            let cellContentA = a.cells[col].textContent;
            let cellContentB = b.cells[col].textContent;
            if(!isNaN(cellContentA.trim())){
                return reverse * (cellContentA.trim() - cellContentB.trim())
            }else if(cellContentA.trim().startsWith("Mon") || cellContentA.trim().startsWith("Tue") || cellContentA.trim().startsWith("Wed") || cellContentA.trim().startsWith("Thu") || cellContentA.trim().startsWith("Fri") || cellContentA.trim().startsWith("Sat") || cellContentA.trim().startsWith("Sun") ){
                let dateA1 = cellContentA.trim().substring(0, 3)
                let dateA2 = cellContentA.trim().substring(4, 26)
                let dateA3 = dateA1 + ", " + dateA2;
                dateA3 = dateA3.replace(" - ", " ")
                let dateB1 = cellContentB.trim().substring(0, 3)
                let dateB2 = cellContentB.trim().substring(4, 26)
                let dateB3 = dateB1 + ", " + dateB2;
                dateB3 = dateB3.replace(" - ", " ")
                return reverse * (Date.parse(dateA3) - Date.parse(dateB3))
            }else if(cellContentA.trim().includes("Days") || cellContentA.trim().includes("Hrs") || cellContentA.trim().includes("Mins") || cellContentA.trim().includes("Seconds") || cellContentA.trim().includes("No Time Estimate")){
                if(cellContentA === "No Time Estimate"){
                    cellContentA = " 0 ";
                }
                if(cellContentB === "No Time Estimate"){
                    cellContentB = " 0 ";
                }
                var mapObj = {
                    Days:"",
                    Hrs:"",
                    Mins:"",
                    Seconds:""
                };
                let timeStart = cellContentA.trim().replace(/Days|Hrs|Mins|Seconds/gi, function(matched){
                    return mapObj[matched];
                });
                let timeEnd = cellContentB.trim().replace(/Days|Hrs|Mins|Seconds/gi, function(matched){
                    return mapObj[matched];
                });
                timeStart = timeStart.replace(/ , /g, "");
                timeEnd = timeEnd.replace(/ , /g, "");
                return reverse * (timeStart - timeEnd)

            }if(cellContentA.includes("m /")){
                let length1 = cellContentA.trim().split("m")
                let length2 = cellContentB.trim().split("m")
                return reverse * (length1[0] - length2[0])
            }else{
                return reverse * (cellContentA.trim().localeCompare(cellContentB.trim()))
            }



        });
        for (i = 0; i < tr.length; ++i) tb.appendChild(tr[i]); // append each row in order
    }

    static makeSortable(table) {
        var th = table.tHead, i;
        th && (th = th.rows[0]) && (th = th.cells);
        if (th) i = th.length;
        else return; // if no `<thead>` then do nothing
        while (--i >= 0) (function (i) {
            var dir = 1;
            th[i].addEventListener('click', function () {
                tableSort.sortTable(table, i, (dir = 1 - dir))
            });
        }(i));
    }

    static makeAllSortable(parent) {
        parent = parent || document.body;
        var t = parent.getElementsByTagName('table'), i = t.length;
        while (--i >= 0) tableSort.makeSortable(t[i]);
    }
}