<?
    define("EXPIRATION", 60*60*24);
    header("Content-Type: application/x-javascript; charset=utf-8");
    header("Cache-Control: public, max-age=" . EXPIRATION);
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + EXPIRATION));
    
    echo file_get_contents("http://www.google-analytics.com/ga.js");
?>