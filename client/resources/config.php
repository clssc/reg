<?php
require_once('./stripe-php-4.3.0/init.php');

$stripe = array(
  // This secret key is bogus, please refer to stripe console and change it to
  // the right one before publishing to server.
  "secret_key"      => "sk_test_BQokikJOvBiI2HlWgH4olfQ2",
  "publishable_key" => "pk_test_k0R3N6jkDi5W4l6tU7ki0P4R"
);

\Stripe\Stripe::setApiKey($stripe['secret_key']);
?>
