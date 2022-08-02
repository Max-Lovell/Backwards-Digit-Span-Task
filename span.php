<?php
if ( $_SERVER['REQUEST_METHOD']=='GET' && realpath(__FILE__) == realpath( $_SERVER['SCRIPT_FILENAME'] ) ) {
        header( 'HTTP/1.0 403 Forbidden', TRUE, 403 );
        die( header( 'location: /error.php' ) );
    } //exit if URL accessed directly

if($_SERVER['HTTP_ORIGIN'] == 'https://users.sussex.ac.uk') { //exit if not from uni server
    header('Access-Control-Allow-Origin: https://users.sussex.ac.uk'); 
    header('Content-Type: application/json');

if(!empty($_POST)){exit;};
if(!empty($_GET)){exit;};
if(!empty($_FILES)){exit;}; //https://st-g.de/2011/04/doing-filename-checks-securely-in-PHP

$post_data = json_decode(file_get_contents('php://input'), true);
if (JSON_ERROR_NONE !== json_last_error()){exit;} //https://stackoverflow.com/questions/48242848/how-to-parse-php-json-decode-data-to-jquery-ajax-request

$post_data = filter_var_array($post_data,[ //https://stackoverflow.com/questions/37533162/sanitize-json-with-php
    'file_name'    => FILTER_SANITIZE_STRING,
    'exp_data'     => ['filter' => FILTER_SANITIZE_STRING,'flags'=> FILTER_REQUIRE_ARRAY]
]);

if (isset($post_data['exp_data']) == true) {//https://www.w3schools.com/php/php_filter.asp
    $data = $post_data['exp_data'];
    
    $args_san = array(
        'trial_num' => FILTER_SANITIZE_NUMBER_INT,
        'span_length' => FILTER_SANITIZE_NUMBER_INT,
        'digit_diff' => FILTER_SANITIZE_NUMBER_INT,
        'encoding_stim' => FILTER_SANITIZE_STRING, //note not 'ints' as could have a leading 0
        'target_stim' => FILTER_SANITIZE_STRING,
        'distractor_stim' => FILTER_SANITIZE_STRING,
        'signal' => FILTER_SANITIZE_STRING,
        'response' => FILTER_SANITIZE_STRING,
        'rt' => array('filter' => FILTER_SANITIZE_NUMBER_FLOAT, 'flags' => FILTER_FLAG_ALLOW_FRACTION),
        'correct' => FILTER_SANITIZE_STRING,
        'confidence' => FILTER_SANITIZE_STRING,
    );
    
    $args_val = array(
            'trial_num' => FILTER_VALIDATE_INT,
            'span_length' => FILTER_VALIDATE_INT,
            'digit_diff' => FILTER_VALIDATE_INT,
            'encoding_stim' => array('filter' => FILTER_VALIDATE_REGEXP, 'options'=>array('regexp'=>'/^\d+$/')),,
            'target_stim' => array('filter' => FILTER_VALIDATE_REGEXP, 'options'=>array('regexp'=>'/^\d+$/')),,
            'distractor_stim' => array('filter' => FILTER_VALIDATE_REGEXP, 'options'=>array('regexp'=>'/^\d+$/')),,
            'signal' => array('filter' => FILTER_VALIDATE_REGEXP, 'options'=>array('regexp'=>'/^[lr|yn]$/')),
            'response' => array('filter' => FILTER_VALIDATE_REGEXP, 'options'=>array('regexp'=>'/^[ei|yn]$/')),
            'rt' => array('filter' => FILTER_SANITIZE_NUMBER_FLOAT, 'flags' => FILTER_FLAG_ALLOW_FRACTION),
            'correct' => FILTER_VALIDATE_BOOLEAN,
            'confidence' => FILTER_VALIDATE_INT,
    );
     
    foreach($data as &$innerArray) {
        $innerArray = filter_var_array($innerArray,$args_san);
        $innerArray = filter_var_array($innerArray,$args_val);
        if(empty($innerArray['correct'])){
            $innerArray['correct']=false;
        };
    };

    $data = json_encode($data);
} else {exit;}

if (isset($post_data['file_name']) == true) {
    $file_name = $post_data['file_name'];
    $file_name = filter_var($file_name, FILTER_SANITIZE_STRING);
    $file_name = filter_var($file_name, FILTER_VALIDATE_REGEXP, array('options'=>array('regexp'=>'/^[0-9]{6}\_(span)$/')));//\_(gabor|dots|breath|span)
} else {exit;}

file_put_contents("../../gfactor/tasks/$file_name.json", $data); //https://stackoverflow.com/questions/43519007/usage-of-http-raw-post-data
//file_put_contents("globals.log", print_r($GLOBALS,true)); //see what file should look like - good security to use the php file to check everything is as it should be in the globals.
} else { exit; }

?>