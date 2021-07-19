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

  $url = 'https://script.google.com/a/westsidechineseschool.org/macros/s/AKfycbyTGd3Pj47dJrNFn04fnCy0qOH2kooxpjrPcQSCib91-Mf1byE/exec';
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

  echo '<span>OK</span><span>' . $familyId . '</span><span>' . strval($dollarAmount) . '</span>';
 
  /*
  echo '<span>' . $result . '</span>';
  echo '<span>' . $regData . '</span>';
  echo '<span>' . $ec . '</span>';
  echo '<span>' . $postdata['data'] . '</span>';
  */
?>
