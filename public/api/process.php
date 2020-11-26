<?php

require_once("include/upload.class.php");

$up = new UploadFolder();
$up->set_folder("upload");
$up->process($_POST["path"], $_POST["prefix"], $_FILES["file"], $_POST["root"], $_POST["last"]);

?>
