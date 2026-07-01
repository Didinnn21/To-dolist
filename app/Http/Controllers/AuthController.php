<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Helpers\SupabaseAuthHelper;
use App\Helpers\JwtHelper;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (!$email || !$password) {
            return response()->json(['error' => 'Email dan password wajib diisi.'], 400);
        }

        // 1. Sign in via Supabase Auth API
        $response = SupabaseAuthHelper::signIn($email, $password);

        if ($response->failed()) {
            $errBody = $response->json();
            $msg = 'Email atau Password salah!';
            $errMsg = $errBody['error_description'] ?? $errBody['msg'] ?? $errBody['error'] ?? '';

            if (str_contains($errMsg, 'Email not confirmed')) {
                $msg = 'Email belum diverifikasi!';
            }
            if ($response->status() === 429 || str_contains(strtolower($errMsg), 'too many requests') || str_contains(strtolower($errMsg), 'rate limit')) {
                return response()->json(['error' => 'Terlahu banyak percobaan login. Silakan tunggu.'], 429);
            }
            return response()->json(['error' => $msg], 401);
        }

        $session = $response->json();
        $userId = $session['user']['id'];

        // 2. Fetch full user record from database table
        $userRecord = User::find($userId);

        if (!$userRecord) {
            // Fallback user metadata
            $fallbackUser = [
                'id' => $userId,
                'email' => $session['user']['email'] ?? $email,
                'name' => $session['user']['user_metadata']['name'] ?? 'User Baru',
                'role' => $session['user']['user_metadata']['role'] ?? 'Staff',
                'avatar' => $session['user']['user_metadata']['avatar'] ?? '',
                'status' => 'Active',
            ];

            $token = JwtHelper::sign($fallbackUser, env('JWT_SECRET', 'dzhirasena_super_secret_key_2024_change_this_in_production'));
            return response()->json(['success' => true, 'token' => $token, 'user' => $fallbackUser]);
        }

        // 3. Check status
        if ($userRecord->status !== 'Active') {
            return response()->json(['error' => 'Hubungi Admin, akun Anda telah dinonaktifkan!'], 403);
        }

        // 4. Generate JWT
        $userPayload = [
            'id' => $userRecord->id,
            'name' => $userRecord->name,
            'email' => $userRecord->email,
            'role' => $userRecord->role,
            'avatar' => $userRecord->avatar,
            'status' => $userRecord->status,
        ];

        $token = JwtHelper::sign($userPayload, env('JWT_SECRET', 'dzhirasena_super_secret_key_2024_change_this_in_production'));

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $userRecord->id,
                'name' => $userRecord->name,
                'email' => $userRecord->email,
                'role' => $userRecord->role,
                'avatar' => $userRecord->avatar,
                'status' => $userRecord->status,
                'npwp' => $userRecord->npwp ?? '',
                'cv_url' => $userRecord->cv_url ?? '',
                'portfolio_url' => $userRecord->portfolio_url ?? '',
                'address' => $userRecord->address ?? '',
                'gender' => $userRecord->gender ?? '',
                'bank_account' => $userRecord->bank_account ?? '',
                'ktp_url' => $userRecord->ktp_url ?? '',
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'status' => $user->status,
                'npwp' => $user->npwp ?? '',
                'cv_url' => $user->cv_url ?? '',
                'portfolio_url' => $user->portfolio_url ?? '',
                'address' => $user->address ?? '',
                'gender' => $user->gender ?? '',
                'bank_account' => $user->bank_account ?? '',
                'ktp_url' => $user->ktp_url ?? '',
            ]
        ]);
    }

    public function logout(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Logout berhasil.']);
    }
}
