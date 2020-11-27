<?php
/**
 * Upload Folder
 *
 * @package     Upload Folder
 * @author      Piepin <piepin@gmail.com>
 * @link        https://github.com/komputronika/UploadFolder
 */

require_once(__DIR__.'/config.php');

Class UploadFolder 
{

    protected $folder = "upload";
    protected $errors = [];
    protected $log = "log.txt";
    protected $path;
    protected $curdir;
    protected $extensions = "*";
    
    public function __construct() 
    {
        error_reporting( 0 & ~E_WARNING & ~E_STRICT & ~E_NOTICE & ~E_DEPRECATED);
        $this->curdir = getcwd();
    }

    public function sendWebhook($message) // sends message to discord
    {
        $webhook_url = getWebhookURL();
        $options = array(
          'http' => array(
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode([ 'username' => 'World Uploader', 'content' => $message ]),
          )
        );
        file_get_contents($webhook_url, false, stream_context_create($options));
    }

    public function set_extensions($extensions) 
    {
        $this->extensions = $extensions;
    }

    public function set_log($log_filename) 
    {
        $this->log = $log_filename;
    }

    public function set_folder($folder_name) 
    {
        $this->folder = $folder_name;
    }

    public function process($path, $prefix, $files, $root, $last, $discord)
    {
        // Original path from user's device
        $original_path  = dirname($path); 

        // Extract file's data
        $file_name      = $files['name'];
        $file_size      = $files['size'];
        $file_tmp       = $files['tmp_name'];
        $file_type      = $files['type'];
        $file_ext       = strtolower(end(explode('.',$file_name)));

        // Check for allowed extensions
        if ($this->extensions != "*") {
            if (!in_array($file_ext, $this->extensions)) {
                $this->errors[] = "This file extension ($file_ext) is not allowed.";
            }
        }

        // If not error
        if (empty($this->errors)) {

            // Real server's dir, eg => /var/www/myfolder/upload
            $base = getLocationToSave() . DIRECTORY_SEPARATOR . $this->folder . DIRECTORY_SEPARATOR . $prefix;
            
            // Upload dir, eg: /var/www/myfolder/upload/MyPictures
            $upload_dir  = $base . DIRECTORY_SEPARATOR . $root . DIRECTORY_SEPARATOR . $original_path . DIRECTORY_SEPARATOR;

            // Upload path, eg: /var/www/myfolder/upload/MyPictures/photo1.jpg
            $upload_path = $upload_dir . DIRECTORY_SEPARATOR. basename($file_name) ;

            // Create target dir if not exist    
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0700, true);

            /* 
            $log_string .= "BASE = ".$base."\n";
            $log_string .= "ORIGINAL_PATH = ".$original_path."\n";
            $log_string .= "UPLOAD_PATH  = ".$upload_path."\n"; 
            */
            $success = move_uploaded_file($file_tmp, $upload_path);
        }
        if ($last == "yes") {
            $zip = new ZipArchive();
            $zip->open("$base/$root.zip", ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator("$base/$root"), RecursiveIteratorIterator::LEAVES_ONLY);
            foreach ($files as $name => $file)
            {
                if (!$file->isDir())
                {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($rootPath) + 1);
                    $zip->addFile($filePath, $relativePath);
                }
            }
            $zip->close();
            $this->sendWebhook("ワールドがアップロードされました。\nDiscord ID: $discord\n企画: $prefix\nURL: ".get_web_root()."/$prefix/$root.zip");
        }
        echo $original_path . DIRECTORY_SEPARATOR . basename($file_name); 
    }
}
