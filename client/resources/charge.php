<?php
  require_once('./config.php');

  $token  = $_POST['stripeToken'];
  $email  = $_POST['stripeEmail'];
  $familyId = strval($_POST['familyId']);
  $dollar = $_POST['dollarAmount'];
  $ec = $_POST['ec'];
  $regData = $_POST['regData'];

  $charge = \Stripe\Charge::create(array(
      'card' => $token,
      'amount'   => $dollar * 100,
      'currency' => 'usd',
      'description' => $familyId . ' ' . $email
  ));

  $url = 'https://script.google.com/macros/s/AKfycby2xzxzyQBZ_ede96n8_CLkXdhc1MdnB74wX1be2S7c0ofL3Jk/exec';
  $postdata = array('data' => json_encode(array(
    'id' => $charge['id'],
    'description' => $charge['description'],
    'livemode' => $charge['livemode'],
    'paid' => $charge['paid'],
    'amount' => $charge['amount'],
    'currency' => $charge['currency'],
    'refunded' => $charge['refunded'],
    'captured' => $charge['captured'],
    'card' => array(
      'id' => $charge['card']['id'],
      'last4' => $charge['card']['last4'],
      'brand' => $charge['card']['brand'],
      'name' => $charge['card']['name']
    ),
    'family_number' => $familyId,
    'email' => $email,
    'ec' => $ec,
    'reg_data' => $regData
  )));
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
  $result = curl_exec($ch);

  echo '<span>OK</span><span>' . $familyId . '</span><span>' . strval($dollarAmount) . '</span><span>' . $result . '</span>'
?>
