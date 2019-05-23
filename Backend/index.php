<?php
$_CONF = [];
$_CONF['host'] = '127.0.0.1';
$_CONF['user'] = 'root';
$_CONF['pass'] = '';
$_CONF['db']   = 'p2pvideo';
@include('conf.php');

@$conn = mysqli_connect($_CONF['host'], $_CONF['user'], $_CONF['pass'], $_CONF['db']);
if(mysqli_connect_error()) {
	http_response_code(500);
	echo mysqli_connect_error();
	exit;
}

$parts = explode('/', substr($_SERVER['REQUEST_URI'], 1));
if($parts[0] === 'api') {
	$method = $_SERVER['REQUEST_METHOD'];
	$content = file_get_contents("php://input");
	$data = json_decode($content);
	if($parts[1] === 'call') {
		if($method === 'OPTIONS') {
			http_response_code(400);
			echo 'POST';
			exit;
		}
		if($method !== 'POST' || !$data || empty($data->codeword) || empty($data->myid)) {
			http_response_code(400);
			echo 'Bad request';
			exit;
		}
		$safeCodeword = mysqli_real_escape_string($conn, $data->codeword);
		$safeId = mysqli_real_escape_string($conn, $data->myid);
		$contact = mysqli_fetch_array(mysqli_query($conn, 'SELECT * FROM `contact` WHERE `codeword`=\''.$safeCodeword.'\' AND `time` > NOW() - INTERVAL 2 MINUTE;'));

		if($contact && !empty($contact['id'])) {
			if($contact['id'] === $data->myid) {
				http_response_code(409);
				echo 'Called myself';
				exit;
			}
			mysqli_query($conn, "UPDATE `contact` SET `id`='' WHERE `codeword`='$safeCodeword';");
			if(mysqli_error($conn)) {
				http_response_code(500);
				echo 'Server error';
				exit;
			}
			header('Content-type: application/json');
			echo '{"success":true, "type":"from", "otherid":"'.$contact['id'].'"}';
			exit;
		} else {
			mysqli_query($conn, "INSERT INTO `contact` (`codeword`, `id`, `time`, `data`) VALUES ('$safeCodeword', '$safeId', CURRENT_TIMESTAMP, '') ON DUPLICATE KEY UPDATE `codeword`='$safeCodeword', `id`='$safeId', `time`=CURRENT_TIMESTAMP;");
			if(mysqli_error($conn)) {
				http_response_code(500);
				echo 'Server error';
				exit;
			}
			header('Content-type: application/json');
			echo '{"success":true, "type":"to"}';
			exit;
		}
		exit;
	}
	http_response_code(404);
	echo 'Not found';
	exit;
}
http_response_code(500);
echo 'Server error';

?>