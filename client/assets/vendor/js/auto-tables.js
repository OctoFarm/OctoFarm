const SORT_TYPES = {
    INT: "int",
    STRING: "string",
    DATE: "date",
};

Date.prototype.valid = function() {
    return isFinite(this);
}

$(document).ready(function() {
    loadAllTableText();
    addEventListeners();
    if($('.tablesort th.tablesort-default').length) {
        $('.tablesort th.tablesort-default').trigger('click');
    }
});

function addEventListeners() {
    $('body').on('click', '.tablesort th', function() {
        tableSort(this);
    });


    $('.tablesearch-input').on('keyup', function() {
        tableSearch(this);
    });
}


////////////////
// Table sort //
////////////////
function tableSort(thClicked) {
    if(!thClicked.hasAttribute("data-tablesort-type")){
        return
    }

    var table       = $(thClicked).closest('.tablesort');
    var columnIndex = getCellIndex(thClicked);
    var rows        = $(table).find('tbody tr');
    var sortType;

    // if no data type is specified, determine it
    if ($(thClicked).data('tablesort-type'))
        sortType = $(thClicked).attr('data-tablesort-type');
    else
        sortType = determineType(thClicked);

    // sort rows descending
    if ($(thClicked).hasClass('tablesort-asc')) {
        $(table).find('thead th').removeClass('tablesort-asc').removeClass('tablesort-desc');
        $(thClicked).addClass('tablesort-desc');

        switch (sortType) {
            case SORT_TYPES.INT:
                rows = sortRowsIntDesc(rows, columnIndex);
                break;
            case SORT_TYPES.DATE:
                rows = sortRowsDateDesc(rows, columnIndex);
                break;
            default:
                rows = sortRowsStringDesc(rows, columnIndex);
                break;
        }
    }

    // sort rows ascending
    else {
        $(table).find('thead th').removeClass('tablesort-asc').removeClass('tablesort-desc');
        $(thClicked).addClass('tablesort-asc');

        switch (sortType) {
            case SORT_TYPES.INT:
                rows = sortRowsInt(rows, columnIndex);
                break;
            case SORT_TYPES.DATE:
                rows = sortRowsDate(rows, columnIndex);
                break;
            default:
                rows = sortRowsString(rows, columnIndex);
                break;
        }
    }

    $(table).find('tbody').html(rows);
}


function determineType(thClicked) {
    var table       = $(thClicked).closest('.tablesort');
    var columnIndex = getCellIndex(thClicked);
    var rows        = $(table).find('tbody tr');
    var isString    = false;


    // if there is any string, return string value
    // otherwise return int value
    for (var count = 0; count < rows.length; count++) {
        var cells = $(rows[count]).find('td');
        var cellValue = $(cells[columnIndex]).text();

        if ($.isNumeric(cellValue) == false)
            isString = true;
    }

    if (isString)
        return SORT_TYPES.STRING;
    else
        return SORT_TYPES.INT;
}



///////////////////////////
// Return the cell index //
///////////////////////////
function getCellIndex(th) {
    var index = $(th).closest('table').find('tr').find(th).index();
    return index;
}

///////////////////////////////
// Sort rows by string value //
///////////////////////////////
function sortRowsString(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var textA  = $(cellsA[columnIndex]).text().toUpperCase();
        var textB  = $(cellsB[columnIndex]).text().toUpperCase();

        return textA < textB ? -1 : 1;
    });

    return sortedRows;
}

///////////////////////////////
// Sort rows by string value //
///////////////////////////////
function sortRowsStringDesc(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var textA  = $(cellsA[columnIndex]).text().toUpperCase();
        var textB  = $(cellsB[columnIndex]).text().toUpperCase();

        return textA > textB ? -1 : 1;
    });

    return sortedRows;
}

//////////////////////////
// Sort rows by integer //
//////////////////////////
function sortRowsInt(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var numA  = parseFloat($(cellsA[columnIndex]).text().trim().replace(' ', '').replace(',', '.'));
        var numB  = parseFloat($(cellsB[columnIndex]).text().trim().replace(' ', '').replace(',', '.'));

        return numA < numB ? -1 : 1;
    });

    return sortedRows;
}

//////////////////////////
// Sort rows by integer desc //
//////////////////////////
function sortRowsIntDesc(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var numA  = parseFloat($(cellsA[columnIndex]).text().trim().replace(' ', '').replace(',', '.'));
        var numB  = parseFloat($(cellsB[columnIndex]).text().trim().replace(' ', '').replace(',', '.'));

        return numA > numB ? -1 : 1;
    });

    return sortedRows;
}

///////////////////////////////
// Sort rows by date YYYMMDD //
///////////////////////////////
function sortRowsDate(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var dateA = new Date($(cellsA[columnIndex]).text());
        var dateB = new Date($(cellsB[columnIndex]).text());

        return dateA < dateB ? -1 : 1;
    });

    return sortedRows;
}


///////////////////////////////
// Sort rows by date YYYMMDD //
///////////////////////////////
function sortRowsDateDesc(rows, columnIndex) {
    var sortedRows = rows.sort(function(a, b) {
        var cellsA = $(a).find('td');
        var cellsB = $(b).find('td');
        var dateA = new Date($(cellsA[columnIndex]).text());
        var dateB = new Date($(cellsB[columnIndex]).text());

        return dateA > dateB ? -1 : 1;
    });

    return sortedRows;
}

function isValidDate(dateString) {
    var testDate = new Date(dateString);
    return testDate.valid();
}


// Table Search

/////////////////////////////
// Load all the table text //
/////////////////////////////
function loadAllTableText() {
    var tablesearchTables = $('.tablesearch-table');

    for (var count = 0; count < tablesearchTables.length; count++)
        loadTableText(tablesearchTables[count]);
}

/////////////////////////
// Load the table text //
/////////////////////////
function loadTableText(table) {
    var cells = $(table).find('tbody td.tablesearch-source');
    if(cells.length === 0) {
        // fallback to all cells
        cells = $(table).find('tbody td');
    }

    for (var count = 0; count < cells.length; count++) {
        var cell = cells[count];
        var upperCaseText = $(cell).text().trim().toUpperCase();
        $(cell).attr('data-tablesearch-text', upperCaseText);
    }
}

//////////////////////
// Search the table //
//////////////////////
function tableSearch(input) {
    var text = $(input).val().toUpperCase();
    var table = $(input).attr('data-tablesearch-table');

    if (text == '' || text.length == 0) {
        $(table).find('tbody tr').removeClass('d-none');
        return;
    }

    $(table).find('tbody tr').addClass('d-none');
    $(table).find('tbody td[data-tablesearch-text*="' + text + '"]').closest('tr').removeClass('d-none');
}