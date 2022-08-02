function getQueryVariable(variable)
{ //https://css-tricks.com/snippets/javascript/get-url-variables/
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

//trial type
var stim_type = getQueryVariable("stim_type") // letters or digits
var span_direction = getQueryVariable("span_direction") // forward or backward
var task_variant = getQueryVariable("task_variant") // normal, 2AFC, SPA or YN (stimulus present/absent A.K.A. yes/no), yes

//experiment settings
var span = 5;
var num_trial = 50;
if(task_variant==="SPA" || task_variant==="2AFC"){
    var stim_order = create_SPA_length();
}
//global vars
var trial_num = 0;
var data_correct = [];
var stim;
var response;
//choice vars
var choice_stim;
var letter_diff = span;

//display elements
var welcome = document.getElementById("welcome");
var stim_disp = document.getElementById("stim_disp");
var response_disp = document.getElementById("response_disp");
var response_instructions = document.getElementById("response_instructions");
var response_label = document.getElementById("response_label");
var resp_stim_type = document.getElementById("stim_type");
var resp_direction = document.getElementById("direction");

var SPA_stim = document.getElementById("SPA_stim");
var AFC_stim = document.getElementById("2AFC_stim");
var AFC_left = document.getElementById("2AFC_left");
var AFC_right = document.getElementById("2AFC_right");

var feedback_disp = document.getElementById("feedback_disp");
var confidence_disp = document.getElementById("confidence");
var confidence_label = document.getElementById("confidence_label");
var confidence_instructions = document.getElementById("confidence_instructions");
var confidence_value = document.getElementById("confidence_value");

//participant input listeners (consider: https://www.the-art-of-web.com/html/input-field-uppercase/)
function key_listener(e){
    if(e.code === 'Space' && window.getComputedStyle(welcome).visibility !== "hidden" && welcome.style.display !== "none"){
        welcome.style.display = "none";
        display_stim() //starts experiment
    } else if(e.code === 'Enter'){
        if(window.getComputedStyle(response_disp).display !== "none" && response_disp.value != ''){
            //do if input text is all numeric only or letters only based on feedback display input 
            give_feedback()
        } else if (window.getComputedStyle(confidence_disp).display !== "none"){
            display_stim()
        }
    } else if(["`","1","2","3","4","5","6","7","8","9","0"].includes(e.key) && window.getComputedStyle(confidence_disp).display !== "none"){
        var slider_val;
        if(e.key === "`"){ slider_val = 0
        } else if(e.key==="0"){ slider_val = 100
        } else {slider_val = Number(e.key)*10}
        confidence_disp.value = slider_val
        confidence_value.innerHTML = slider_val+"%"
    } else if(["y","n"].includes(e.key) && window.getComputedStyle(SPA_stim).display !== "none"){
        give_feedback(e.key)
    } else if(["e","i"].includes(e.key) && window.getComputedStyle(AFC_stim).display !== "none"){
        give_feedback(e.key)
    }
}
document.addEventListener('keydown', key_listener)

function slider_listener(e){
    confidence_value.innerHTML = confidence_disp.value+"%"
}
confidence_disp.addEventListener('input', slider_listener)

//helper functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) { //Fisher-Yates (aka Knuth) Shuffle.
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) { // While there remain elements to shuffle...
      randomIndex = Math.floor(Math.random() * currentIndex);// Pick a remaining element...
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [ // And swap it with the current element.
        array[randomIndex], array[currentIndex]];
    }
    return array;
}

function create_SPA_length(){
    var trials_half  = Math.ceil(num_trial/2)
    var trials_order = [];
    if(task_variant==="SPA"){
        let trials_p = Array(trials_half).fill("present")
        let trials_a = Array(trials_half).fill("absent")
        trials_order = trials_p.concat(trials_a)
    } else if(task_variant==="2AFC"){
        let trials_l = Array(trials_half).fill("left")
        let trials_r = Array(trials_half).fill("right")
        trials_order = trials_l.concat(trials_r)
    }
    trials_order = shuffle(trials_order)
    console.log(trials_order)
    return trials_order
}

//stim calc
function staircase(get_span_diff=false){
    var back1;
    if(trial_num>0){
        back1 = data_correct[trial_num-1]
        if(back1==="incorrect"){
            if(task_variant==="normal"){
                span -= 1
            } else if(task_variant==="SPA" || task_variant==="2AFC"){ //make things easier - increase amount of different letters between stim and encoding set, or decrease 
                if(letter_diff === span){ 
                    span -= 1 //length of the encoding set is decreased by 1
                    letter_diff = 1 //reset letter diff
                } else {
                    letter_diff += 1 //increase amount of letters changed between encoding and noise stim set by 1
                }
            }
        }
    }
    if(trial_num>1){
        var back2;
        //slice copies array to prevent editing original, then reverse it as findIndex finds first ocurrence
        var last_correct_count = data_correct.slice().reverse().findIndex(correct_trial => correct_trial === false); //arrow function passes each index of array from findIndex and tests for === false
        //If no incorrect trials and even trial number (findIndex returns -1 if none exist) OR last trial not false and number of correct trials since last incorrect response is an even number
        if((last_correct_count===-1 && trial_num % 2) || (last_correct_count > 0 && last_correct_count % 2 === 0)){
            back2 = data_correct[trial_num-2]
        } else {back2 = "incorrect"} //else pretend two trials ago was false anyway, so that intensity isn't changed. 
        
        if(back1==="correct" && back2==="correct"){
            if(task_variant==="normal"){
                span += 1
            } else if(task_variant==="SPA" || task_variant==="2AFC"){
                if(letter_diff === 1){ //changes in stimulus intensity proceed until there is only one letter difference between the real encoding set and the false one
                    span += 1 //length of the encoding set is increased by 1
                    letter_diff = 2 //for first trial after am increase in span, keep number of same letters unchanged
                } else {
                    letter_diff -= 1
                }
            }
        }
    }
    if(span < 4){span=3}
    console.log('letter_diff: ',letter_diff,' span_length: ',span)
    if(get_span_diff===true){ return letter_diff
    } else { return span }
}

//experiment loop
function display_stim(){
    confidence_disp.style.display = "none";
    confidence_label.style.display = "none";
    confidence_instructions.style.display = "none";
    confidence_value.style.display = "none";
    response_disp.value = ''

    stim_disp.style.display = "block";
    span = staircase()
    trial_num += 1
    console.log(trial_num)

    if(stim_type==="digits"){
        stim = '';
        let numbers ='0123456789';
        for (var i=0; i<span; i++) {
            stim += numbers.charAt(Math.floor(Math.random() * numbers.length));
       }
    } else if(stim_type==="letters"){
        stim = '';
        let characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (var i=0; i<span; i++) {
            stim += characters.charAt(Math.floor(Math.random() * characters.length));
       }
    }
    stim_disp.innerHTML = stim;
    delay(1000).then(() => ask_response())
}

function calc_SPA(current_stim){
    var calc_stim = current_stim
    letter_diff = staircase(true)
    //replace each letter 
    var index_bucket = [...Array(span).keys()];
    for(var i = 0; i<letter_diff; i++){
        var bucket_index = index_bucket.length > 1 ? Math.floor(Math.random() * index_bucket.length) : 0
            var replace_index = index_bucket[bucket_index]
            index_bucket.splice(bucket_index, 1)
        var replacement_char = '';
        if(stim_type==="letters"){
            var characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(calc_stim[replace_index],'') //don't replace with the same letter!
            replacement_char = characters.charAt(Math.floor(Math.random() * characters.length))
        } else if(stim_type==="digits"){
            var numbers = '0123456789'.replace(calc_stim[replace_index],'')
            replacement_char = numbers.charAt(Math.floor(Math.random() * numbers.length))
        }
        console.log(replacement_char)
        calc_stim = calc_stim.substring(0,replace_index) + replacement_char + calc_stim.substring(replace_index+1);
        //console.log(index_bucket,replace_index,replacement_char,choice_stim)
    }
    return calc_stim
    //var SPA_stim.charAt(Math.floor(Math.random() * SPA_stim.length))
}

function ask_response(){
    stim_disp.style.display = "none";
    if(task_variant === "normal"){
        response_label.style.display = "block";
        response_disp.style.display = "block";
        response_instructions.style.display = "block";
        resp_stim_type.innerHTML = stim_type
        if(span_direction === "backward"){
            resp_direction.innerHTML = "reverse order"
        }
        response_disp.focus()
        console.log(stim)
    } else if(task_variant === "SPA"){
        SPA_stim.style.display = "block";
        //make room for one stimlus up top
        if(stim_order[trial_num-1]==="absent"){ choice_stim = calc_SPA(stim)
        } else { choice_stim = stim }
        var disp_stim = choice_stim
        if(span_direction === "backward"){disp_stim = choice_stim.split('').reverse().join('')}
        //change to be nothing extra if direction is forwards
        SPA_stim.innerHTML = "Are these the "+stim_type+" previously displayed " + span_direction + "s?<br><br><strong>" + disp_stim + 
                            "</strong><br><br>Press Y (yes) or N (no) to continue."
    } else if(task_variant === "2AFC"){
        AFC_stim.style.display = "block";
        AFC_left.style.display = "block";
        AFC_right.style.display = "block";
        choice_stim = calc_SPA(stim)
        var left;
        var right;
        var disp_stim = stim
        if(span_direction === "backward"){disp_stim = stim.split('').reverse().join('')}
        if(stim_order[trial_num-1]==="left"){ 
            left = disp_stim
            right = choice_stim
        } else { 
            left = choice_stim
            right = disp_stim
        }
        AFC_stim.innerHTML = "Which of these are the " + stim_type + " previously displayed " + 
                                span_direction + "s?<br><br><strong>" +
                                left + "</strong>&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;<strong>" + right +
                                "</strong><br><br>Press E (left) or I (right) to continue."
        console.log(stim,disp_stim)
    }
}

function give_feedback(key_press){
    SPA_stim.style.display = "none";
    AFC_stim.style.display = "none";
    AFC_left.style.display = "none";
    AFC_right.style.display = "none";
    response_disp.style.display = "none";
    response_label.style.display = "none";
    response_instructions.style.display = "none";
    feedback_disp.style.display = "block";
    if(task_variant === "normal"){ 
        var response = response_disp.value.toString().toUpperCase();
        if(span_direction === "backward"){response = response.split('').reverse().join('')}
        if(response === stim){
            data_correct.push("correct")
        } else {
            data_correct.push("incorrect")
        };
    } else if(task_variant === "SPA"){
        if(choice_stim === stim && key_press === "y"){
            data_correct.push("correct")
        } else if(choice_stim !== stim && key_press === "n"){
            data_correct.push("correct")
        } else if(choice_stim !== stim && key_press === "y"){
            data_correct.push("incorrect")
        } else if(choice_stim === stim && key_press === "n"){
            data_correct.push("incorrect")
        }
    } else if(task_variant === "2AFC"){
        if(stim_order[trial_num-1]==="left" && key_press === "e"){
            data_correct.push("correct")
        } else if(stim_order[trial_num-1]==="right" && key_press === "i"){
            data_correct.push("correct")
        } else {
            data_correct.push("incorrect")
        }
    }
    feedback_disp.innerHTML = data_correct[data_correct.length - 1]
    delay(500).then(() => get_confidence());
}

function get_confidence(){
    confidence_disp.value = 0
    confidence_value.innerHTML = "0%"
    feedback_disp.style.display = "none";
    confidence_disp.style.display = "block";
    confidence_label.style.display = "block";
    confidence_instructions.style.display = "block";
    confidence_value.style.display = "block";
}
