const currentIssues = [];

export default class PrinterTicker{
    static addIssue(date, message){
        let id = null;
        if(currentIssues.length === 0){
            //first issue
            id = 0;
        }else{
            id = currentIssues[currentIssues.length-1].id + 1;
        }
        const newIssue = {
            id: id,
            date: date,
            message: message
        };
        currentIssues.push(newIssue);
        if(currentIssues.length >= 10){
            currentIssues.pop();
        }
    }
    static removeIssue(id){
        const index = _.findIndex(currentIssues, function(o) { return o.id == id; });
        currentIssues.splice(index, 1);
    }
    static returnIssue(){
        return currentIssues;
    }
}