function separator(numb) {
    var str = numb.toString().split('');
    console.log(str)
    //this uses lookahead assertions (LA):
        // /\B looks for where previous and next character are of same type
        // (?=(\d)) says only if /B is followed by a digit
        // (?!\d)) is a negative LA, only if is not followed by a digit 
        // /g matches everything
    str[0] = str[0].replace(/\B(?=(\d))/g, ",");
    console.log(str)
}

function delay(ms) {
    // promise object returned by new 'Promise' has a state and result
        //state init to 'pending', then is fulfilled or rejected when resolve or reject (or reject(error)) are called.
    // executor (the producing code)
        // code in here is what will produce the result we are waiting for
        // resolve or reject are automatically run depending on the success of the executor
        // created automatically - don't change but call only one when ready
    return new Promise(resolve => setTimeout(resolve, ms));
    // with future .then calls, use empty and arrow function to get nothing from resolve, just ensure it happens e.g. .then(() => function())
}