<?php
require_once('./stripe-php-4.3.0/init.php');

$stripe = array(
  // This secret key is bogus, please refer to stripe console and change it to
  // the right one before publishing to server.
  "secret_key"      => "sk_live_iEw1Zi3CpKfSN7tX3SUwH0v9",
  "publishable_key" => "pk_live_nGVIQje5vy4A0MiOFCv40GB9"
);

\Stripe\Stripe::setApiKey($stripe['secret_key']);
?>
