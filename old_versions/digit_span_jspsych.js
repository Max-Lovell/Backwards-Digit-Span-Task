var timeline = [];

var digit_span = {
    type: 'html-keyboard-response',
    choices: jsPsych.NO_KEYS, //no response allowed
    trial_duration: 2000,
    stimulus: Array.from({length: span}, () => Math.floor(Math.random() * 10)),
    prompt: `<p>Try to remember the number presented</p>`,
    on_finish: function(data) {data.span = span} //run in on_finish as functions are called before trial otherwise
}

timeline.push(digit_span);

jsPsych.init({
    timeline: timeline,
});