<?php
  require_once('./config.php');

  $token  = $_POST['stripeToken'];
  $email  = $_POST['stripeEmail'];
  $familyId = strval($_POST['familyId']);
  $dollar = $_POST['dollarAmount'];

  $customer = Stripe_Customer::create(array(
      'email' => $email,
      'card'  => $token,
      'description' => $familyId
  ));

  $charge = Stripe_Charge::create(array(
      'customer' => $customer->id,
      'amount'   => $dollar * 100,
      'currency' => 'usd',
      'description' => $familyId
  ));

  echo '<span>OK</span><span>' . $familyId . '</span><span>' . strval($dollarAmount) . '</span>'
?>
