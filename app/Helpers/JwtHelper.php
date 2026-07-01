<?php

namespace App\Helpers;

class JwtHelper
{
    private static function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data)
    {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    public static function sign($payload, $secret, $expiry = 86400)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + $expiry;
        $payloadStr = json_encode($payload);

        $signatureInput = self::base64UrlEncode($header) . '.' . self::base64UrlEncode($payloadStr);
        $signature = hash_hmac('sha256', $signatureInput, $secret, true);

        return $signatureInput . '.' . self::base64UrlEncode($signature);
    }

    public static function verify($token, $secret)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        $signatureInput = $headerEncoded . '.' . $payloadEncoded;
        
        $expectedSignature = hash_hmac('sha256', $signatureInput, $secret, true);
        if (self::base64UrlEncode($expectedSignature) !== $signatureEncoded) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }
}
