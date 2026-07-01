<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;

class SupabaseAuthHelper
{
    private static function getUrl()
    {
        return env('SUPABASE_URL');
    }

    private static function getAnonKey()
    {
        return env('SUPABASE_ANON_KEY');
    }

    private static function getServiceKey()
    {
        return env('SUPABASE_SERVICE_ROLE_KEY');
    }

    public static function signIn($email, $password)
    {
        return Http::withHeaders([
            'apikey' => self::getAnonKey(),
            'Content-Type' => 'application/json',
        ])->post(self::getUrl() . '/auth/v1/token?grant_type=password', [
            'email' => trim(strtolower($email)),
            'password' => $password,
        ]);
    }

    public static function createUser($email, $password, $metadata = [])
    {
        return Http::withHeaders([
            'apikey' => self::getServiceKey(),
            'Authorization' => 'Bearer ' . self::getServiceKey(),
            'Content-Type' => 'application/json',
        ])->post(self::getUrl() . '/auth/v1/admin/users', [
            'email' => trim(strtolower($email)),
            'password' => $password,
            'email_confirm' => true,
            'user_metadata' => $metadata
        ]);
    }

    public static function updateUser($id, $data)
    {
        return Http::withHeaders([
            'apikey' => self::getServiceKey(),
            'Authorization' => 'Bearer ' . self::getServiceKey(),
            'Content-Type' => 'application/json',
        ])->put(self::getUrl() . '/auth/v1/admin/users/' . $id, $data);
    }

    public static function deleteUser($id)
    {
        return Http::withHeaders([
            'apikey' => self::getServiceKey(),
            'Authorization' => 'Bearer ' . self::getServiceKey(),
        ])->delete(self::getUrl() . '/auth/v1/admin/users/' . $id);
    }
}
