//SETUP -------------------------------------------------------------------------------
// dom elements
const text_disp = document.getElementById("text_disp")
const stim = document.getElementById("stim_cont") //STIM---
const l_stim = document.getElementById("l_stim")
const m_stim = document.getElementById("m_stim")
const r_stim = document.getElementById("r_stim")
const left = document.getElementById("left")
const right = document.getElementById("right")
const conf = document.getElementById("conf") //CONFIDENCE---
const conf_sl = document.getElementById("conf_sl") // slider
const conf_val = document.getElementById("conf_val") // text underneath displaying %
const conf_b = document.getElementById("conf_b") // submit

// experiment settings
let task_variant = "YN" // 2AFC, YN
let span = [5,5] //first is span length, second is difference in letters
const n_trial = 5
const n_block = 5
const n_prac = 1
let trial_order = trialOrder()

// init vars
let trial_n = 0
let breaker = false
let instructions = false
let correct = []
const p_data = []
let start_time = 0

// begin exp
document.addEventListener('keydown',continueListener,true) //begins experiment on pressing spacebar
document.addEventListener('click',continueListener,true)

//HELPER FUNCTIONS ------------------------------------------------------------------------
function continueListener(e){
    if(e instanceof KeyboardEvent && !(e.key===' '||e.code==='Space'||e.keyCode===32)){ return 
    } else {
        document.removeEventListener('keydown',continueListener,true)
        document.removeEventListener('click',continueListener,true)
        runTrial()
    }
}

function getQueryVariable(variable){ //https://css-tricks.com/snippets/javascript/get-url-variables/
    const vars = window.location.search.substring(1).split("&")
    const vars_l = vars.length
    let pair
    for (let i=0; i<vars_l; i++) {
            pair = vars[i].split("=")
            if(pair[0] === variable){return pair[1]}
    }
    return(false)
}

function shuffle(array) { //Fisher-Yates (aka Knuth) Shuffle.
    let currentIndex = array.length, randomIndex
    while (currentIndex != 0) { // While there remain elements to shuffle
      randomIndex = Math.floor(Math.random() * currentIndex) // Pick remaining element
      currentIndex--
      ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]] // swap with current element.
    }
    return array;
}

// trial order
function trialOrder(){
    const all_trials = (n_trial+n_prac)-5 //cieling makes sure there's enough with odd numbers of trials
    const type_a = Array(all_trials).fill('present') //if 2AFC then refers to left stim, if YN then only present
    const type_b = Array(all_trials).fill('absent')
    let trial_order = type_a.concat(type_b)
    trial_order = shuffle(trial_order)
    trial_order.unshift('present','present','absent','absent','present') //5 practice trials
    return trial_order
}

// delay for task loop
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

//STIMULI CREATION -----------------------------------------------------------------------------
function staircase(){ //change task difficult based on performance
    const back1 = correct[trial_n-1]
    let back2 = false
    const last_correct_count = correct.slice().reverse().findIndex(correct_trial => correct_trial === false); //copy array, reverse it, find first ocurrence. => passes index and tests
    if( (trial_n>1 && last_correct_count===-1 && trial_n%2===0) || (last_correct_count > 0 && last_correct_count%2 === 0) ){ //no incorrect (-1) and even trial number OR even correct trials since last incorrect
        back2 = correct[trial_n-2] 
    }
    if(back1===false){//make things easier - increase amount of different letters between stim and encoding set, or decrease 
        if(span[1] === span[0]){  //if difference is same as span length - i.e. all digits are different between encoding and distractor
            span[0] -= 1 //length of the encoding set is decreased by 1
            span[1] = 1 //letter diff is 1 - i.e. hardest level
        } else { span[1] += 1 }//increase amount of letters changed between encoding and noise stim set by 1 
    } else if(back1 && back2){
        if(span[1] === 1){ //changes in stimulus intensity proceed until there is only one letter difference between the real encoding set and the false one
            span[0] += 1 //length of the encoding set is increased by 1
            span[1] = span[0] //all letters are different - start easiest level and get harder
        } else { span[1] -= 1 } //decrease digit difference
    }
    if(span[0]<3){ span[0]=3 } //set lower bound
}

function encodingStim(){
    const span_l = span[0]
    let encoder = ''
    for (let i=0; i<span_l; i++) {
        encoder += Math.floor(Math.random() * 10).toString() // 10==numbers.length
    }
    return encoder
}

function distractorStim(encoder){
    let index_bucket = [...Array(encoder.length).keys()] // list of indices in distractor stim e.g. if length=5; [0,1,2,3,4]
    const span_diff = span[1] //digit difference - how many letters to replace
    let unaltered_idx,replace_index,numbers,replacement_char
    for(let i=0; i<span_diff; i++){
        unaltered_idx = index_bucket.length > 1 ? Math.floor(Math.random() * index_bucket.length) : 0 //find unchanged index i.e. random index from what's left in the bucket of indices (or 0 if length=0)
        replace_index = index_bucket[unaltered_idx] //index of the number in stimuli that hasn't been changed yet
        index_bucket.splice(unaltered_idx, 1) // remove index from bucket
        numbers = '0123456789'.replace(encoder[replace_index],'') //remove the target number so not replaced with the same number
        replacement_char = numbers.charAt(Math.floor(Math.random() * numbers.length)) //select a random number from what's left to replace it with
        encoder = encoder.substring(0,replace_index) + replacement_char + encoder.substring(replace_index+1) //replace random index of stim with random different number
    }
    return encoder
}

// T1 TASK -----------------------------------------------------------------------------
function displayEncoding(){
    conf.style.display = "none"
    text_disp.style.display = "block"
    text_disp.style.fontSize = '35px'
    const encoder = encodingStim()
    text_disp.innerHTML = encoder
    delay(1000).then(() => askResponse(encoder))    
}

function askResponse(encoder){
    text_disp.style.display = 'none'
    stim.style.display = 'block'
    const distractor = distractorStim(encoder)
    const target = encoder.split('').reverse().join('')
    if(task_variant === "YN"){
        if(trial_order[trial_n-1]==="present"){ m_stim.innerHTML = target
        } else { m_stim.innerHTML = distractor }
        left.addEventListener('click',respList,true)
        right.addEventListener('click',respList,true)
    } else {
        if(trial_order[trial_n-1]==="present"){ 
            l_stim.innerHTML = target
            r_stim.innerHTML = distractor
        } else { 
            l_stim.innerHTML = distractor
            r_stim.innerHTML = target 
        }
        l_stim.addEventListener('click',respList,true)
        r_stim.addEventListener('click',respList,true)
    }
    document.addEventListener('keydown',respList,true)
    start_time = performance.now()
    p_data.push({
        'trial_n': trial_n,
        'span_length': span[0], 
        'digit_diff': span[1],
        'target': trial_order[trial_n-1],
        'encoder': encoder,
        'distractor': distractor
    })
}

function respList(e){
    let response = '' 
    if(e instanceof KeyboardEvent){
        const key_press = e.key.toUpperCase()
        if(key_press===left.value.charAt(0) || key_press===right.value.charAt(0)){
            if(key_press==="Y"||key_press==="E"){ response="present" //"present" in 2AFC trials refers to the left stim
            } else if(key_press==="N"||key_press==="I"){ response="absent" } //if trial_order[x]==="absent" then first stim was absent so right would be correct
        } else { return }
    } else { 
        if(e.target.id === 'left' || e.target.id === "l_stim"){ response = "present"
        } else  if(e.target.id === 'right' || e.target.id === "r_stim"){ response = "absent"}
    }

    if(response != ''){
        document.removeEventListener('keydown',respList,true)
        if(task_variant==="YN"){
            left.removeEventListener('click',respList,true)
            right.removeEventListener('click',respList,true)
        } else {
            l_stim.removeEventListener('click',respList,true)
            r_stim.removeEventListener('click',respList,true)
        }
        stim.style.display = 'none'
        const correct_t = response===trial_order[trial_n-1]
        correct.push(correct_t) //just easier and quicker than getting out of the object
        p_data[trial_n-1].response = response
        p_data[trial_n-1].rt = e.timeStamp - start_time
        p_data[trial_n-1].correct = correct_t

        //move on
        if(trial_n>n_prac){ getConfidence()
        } else { //feedback
            let fdbk
            if(correct_t){ fdbk = 'Correct!'
            } else { fdbk = 'Incorrect'}
            text_disp.innerHTML = fdbk
            text_disp.style.display = "block"
            delay(300).then(()=>{runTrial()})
        }
    }
}

// CONFIDENCE -----------------------------------------------------------------------------
function getConfidence(){
    text_disp.style.display = "none"
    conf_sl.value = 0
    conf_val.innerHTML = "0%"
    conf.style.display = "block"
    document.addEventListener('keydown',confidenceKey, true)
    conf_sl.addEventListener("input", sliderChange, true)
    conf_b.addEventListener("click", confSubmit, true)
    //span = staircase()
}

// event listeners
function sliderChange(){
    conf_val.innerHTML = conf_sl.value+"%"
}

function confidenceKey(e){
    //slider values based on number keys
    if(["`","1","2","3","4","5","6","7","8","9","0"].includes(e.key)){
        let slider_val = 0
        if(e.key === "`"){ slider_val = 0
        } else if(e.key==="0"){ slider_val = 100
        } else {slider_val = Number(e.key)*10}
        conf_sl.value = slider_val
        conf_val.innerHTML = slider_val+"%"
    //enter to continue
    } else if(e.code === 'Enter'){ confSubmit() }
}

function confSubmit(){
    document.removeEventListener('keydown',confidenceKey,true)
    conf_sl.removeEventListener('input', sliderChange,true)
    conf_b.removeEventListener('click', confSubmit, true)
    conf.style.display = 'none'
    p_data[trial_n-1].confidence = conf_sl.value
    runTrial()
}

// EXPERIMENT FUNCTIONS  -----------------------------------------------------------------------------
function trialNumber(instr_cb){ // must be a better way to do this? e.g. resolve promises on even listeners
    if(trial_n===n_trial+n_prac+1){ // try this in future: https://stackoverflow.com/questions/35718645/resolving-a-promise-with-eventlistener
        if(task_variant==="YN"){ //switch task 
            task_variant="2AFC"
            trial_order = trialOrder()
            trial_n = 0
            span = [5,5] //reset span length
            correct = []
            breaker = false
            instructions=true
            //instructions screen
            text_disp.innerHTML= 'This task is nearly the same, except your task is to decide which of 2 numbers presented are the reverse of the one shown previously. '+
            'For example, if you are shown 12345 and then asked to choose between 54321 and 54231, the correct answer would be the first option.<br><br>'+
            'These options are presented side by side, and your task is to indicate if the left or right option is correct.<br><br>'+
            'You can click on them, or press the \'E\' key to choose the left option, or the \'I\' key for the left option. '+
            'As before, the first '+n_prac+' trials are practice trials with feedback.<br><br>'+
            'Please press Spacebar or click anywhere to begin'
            //stim display
            document.getElementById("stim_instr").innerHTML = 'Which of these are the numbers previously displayed backwards?'
            m_stim.innerHTML = '|'
            document.getElementById("input_instr").innerHTML = 'Press E (left) or I (right) or click the correct number to continue.'
            document.getElementById("buttons").style.display = 'none'
        } else if(task_variant === "2AFC"){  //end task
            document.removeEventListener('keydown',continueListener,true)
            document.removeEventListener('click',continueListener,true)
            //SAVE DATA AND CREATE LINK
            const sbj_id = getQueryVariable("sbj_id")
            const px_cm = getQueryVariable("px_cm")
            const task_order_str = getQueryVariable("task_order") 
            const task_order = JSON.parse(decodeURIComponent(task_order_str))
            const next_task = task_order.findIndex((element) => element === 'span')+1
            const link = 'https://users.sussex.ac.uk/mel29/'+task_order[next_task]+'/'+task_order[next_task]+'.html?task_order='+task_order_str+'&sbj_id='+sbj_id+'&px_cm='+px_cm
            saveData(sbj_id,()=>{window.location.replace(link)})
        }
    } else if((trial_n-n_prac)%(n_trial/n_block)===0 && trial_n>n_prac && trial_n<n_trial+n_prac && breaker===true){ //
        const block_num = (trial_n-n_prac)/(n_trial/n_block)
        text_disp.innerHTML= 'You have completed '+block_num+' out of '+n_block+' blocks of trials.<br><br>Feel free to take a break, and press spacebar of click anywhere to continue.'  
        breaker=false //allows code to bypass the break screen without increasing the trial counter. could just decrease trial counter in function?
        instructions=true
    }
    if(instructions===true){
        text_disp.style.fontSize = "25px"
        conf.style.display = "none"
        text_disp.style.display = "block"
        document.addEventListener('keydown',continueListener,true)
        document.addEventListener('click',continueListener,true)
    }
    instr_cb()
}

function runTrial(){
    trialNumber(()=>{ //check if anything extra needs to be done on this trial (instructions, switch task variant, etc.)
        if(instructions===true){
            instructions=false
            return //exit if instruction or break screen needs to be presented, and skip once spacebar is pressed
        }
        staircase()
        breaker = true    
        trial_n++        
        displayEncoding()     
    })
}

function saveData(sbj_id,next_task){
    const json_data = JSON.stringify({
            file_name: sbj_id + "_span", 
            exp_data: p_data
        })
    const xhr = new XMLHttpRequest()
    xhr.onload = function() { next_task() } //move on to next task
    xhr.open('POST', 'https://users.sussex.ac.uk/mel29/span/span.php', true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(json_data)
}