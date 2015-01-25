<?php
  require_once('./config.php');

  $token  = $_POST['stripeToken'];
  $email  = $_POST['stripeEmail'];
  $familyId = strval($_POST['familyId']);
  $dollar = $_POST['dollarAmount'];

  $charge = Stripe_Charge::create(array(
      'card' => $token,
      'amount'   => $dollar * 100,
      'currency' => 'usd',
      'description' => $familyId . ' ' . $email
  ));

  echo '<span>OK</span><span>' . $familyId . '</span><span>' . strval($dollarAmount) . '</span>'
?>
