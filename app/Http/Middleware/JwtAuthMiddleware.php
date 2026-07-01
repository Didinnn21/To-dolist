<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Helpers\JwtHelper;
use App\Models\User;

class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $authHeader = $request->header('Authorization');
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Token tidak ditemukan atau format salah.'], 401);
        }

        $token = substr($authHeader, 7);
        $payload = JwtHelper::verify($token, env('JWT_SECRET', 'dzhirasena_super_secret_key_2024_change_this_in_production'));
        if (!$payload) {
            return response()->json(['error' => 'Sesi berakhir atau token tidak valid.'], 401);
        }

        $user = User::find($payload['id']);
        if (!$user) {
            return response()->json(['error' => 'Pengguna tidak ditemukan.'], 401);
        }

        if ($user->status !== 'Active') {
            return response()->json(['error' => 'Hubungi Admin, akun Anda telah dinonaktifkan!'], 401);
        }

        // Check role permission constraints if passed as parameters
        if (!empty($roles)) {
            if (!in_array($user->role, $roles)) {
                return response()->json(['error' => 'Akses ditolak. Anda tidak memiliki izin.'], 403);
            }
        }

        // Set request user resolver for Laravel request helpers ($request->user())
        $request->setUserResolver(fn() => $user);

        return $next($request);
    }
}
