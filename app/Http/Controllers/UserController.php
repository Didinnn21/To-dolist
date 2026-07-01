<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Helpers\SupabaseAuthHelper;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request)
    {
        $users = User::orderBy('name')->get([
            'id', 'name', 'email', 'role', 'avatar', 'status', 
            'npwp', 'cv_url', 'portfolio_url', 'address', 'gender', 'bank_account', 'ktp_url'
        ]);
        return response()->json(['users' => $users]);
    }

    // POST /api/users (Admin only)
    public function store(Request $request)
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'Admin') {
            return response()->json(['error' => 'Akses ditolak. Hanya Admin yang diizinkan.'], 403);
        }

        $name = $request->input('name');
        $email = $request->input('email');
        $password = $request->input('password');
        $role = $request->input('role');
        $avatar = $request->input('avatar', '');

        if (!$name || !$email || !$password || !$role) {
            return response()->json(['error' => 'Nama, email, password, dan role wajib diisi.'], 400);
        }

        // 1. Create user in Supabase Auth using Admin API
        $response = SupabaseAuthHelper::createUser($email, $password, [
            'name' => $name,
            'role' => $role,
            'avatar' => $avatar
        ]);

        if ($response->failed()) {
            return response()->json(['error' => $response->json()['message'] ?? 'Gagal membuat pengguna di Auth.'], 400);
        }

        $authData = $response->json();
        $newUserId = $authData['id'] ?? $authData['user']['id'] ?? null;

        if (!$newUserId) {
            return response()->json(['error' => 'ID pengguna baru tidak valid dari respon Auth.'], 500);
        }

        // 2. Insert to public.wf_users database table
        $user = User::create([
            'id' => $newUserId,
            'name' => $name,
            'email' => trim(strtolower($email)),
            'role' => $role,
            'avatar' => $avatar,
            'status' => 'Active',
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'status' => $user->status,
            ]
        ], 201);
    }

    // PUT /api/users/{id}
    public function update(Request $request, $id)
    {
        $currentUser = $request->user();
        $isAdmin = in_array($currentUser->role, ['Admin', 'Project Manager']);

        if ($currentUser->id !== $id && !$isAdmin) {
            return response()->json(['error' => 'Akses ditolak. Anda tidak memiliki hak untuk mengubah profile ini.'], 403);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Pengguna tidak ditemukan.'], 404);
        }

        // Prepare data to update
        $fields = $request->only([
            'name', 'role', 'npwp', 'cv_url', 'portfolio_url', 
            'address', 'gender', 'bank_account', 'ktp_url'
        ]);

        // Non-admin cannot update roles
        if (!$isAdmin && isset($fields['role'])) {
            unset($fields['role']);
        }

        $user->update($fields);

        // Update name/role in Supabase Auth metadata too (optional but recommended for sync)
        $meta = [];
        if (isset($fields['name'])) $meta['name'] = $fields['name'];
        if (isset($fields['role'])) $meta['role'] = $fields['role'];
        if (!empty($meta)) {
            SupabaseAuthHelper::updateUser($id, ['user_metadata' => $meta]);
        }

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    // PUT /api/users/{id}/password
    public function updatePassword(Request $request, $id)
    {
        $currentUser = $request->user();
        $isAdmin = in_array($currentUser->role, ['Admin', 'Project Manager']);

        if ($currentUser->id !== $id && !$isAdmin) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $password = $request->input('password');
        if (!$password || strlen($password) < 6) {
            return response()->json(['error' => 'Kata sandi minimal 6 karakter.'], 400);
        }

        $response = SupabaseAuthHelper::updateUser($id, ['password' => $password]);
        if ($response->failed()) {
            return response()->json(['error' => 'Gagal memperbarui kata sandi: ' . ($response->json()['message'] ?? '')], 400);
        }

        return response()->json(['success' => true, 'message' => 'Kata sandi berhasil diperbarui.']);
    }

    // PUT /api/users/{id}/status (Admin only)
    public function updateStatus(Request $request, $id)
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'Admin') {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $status = $request->input('status');
        if (!$status || !in_array($status, ['Active', 'Inactive'])) {
            return response()->json(['error' => 'Status tidak valid. Gunakan Active atau Inactive.'], 400);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Pengguna tidak ditemukan.'], 404);
        }

        $user->update(['status' => $status]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'status' => $user->status,
            ]
        ]);
    }

    // PUT /api/users/{id}/avatar
    public function updateAvatar(Request $request, $id)
    {
        $currentUser = $request->user();
        $isAdmin = in_array($currentUser->role, ['Admin', 'Project Manager']);

        if ($currentUser->id !== $id && !$isAdmin) {
            return response()->json(['error' => 'Tidak diizinkan.'], 403);
        }

        $avatar = $request->input('avatar');
        if (!$avatar) {
            return response()->json(['error' => 'URL avatar wajib diisi.'], 400);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Pengguna tidak ditemukan.'], 404);
        }

        $user->update(['avatar' => $avatar]);

        // Sync metadata
        SupabaseAuthHelper::updateUser($id, [
            'user_metadata' => ['avatar' => $avatar]
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'status' => $user->status,
            ]
        ]);
    }

    // DELETE /api/users/{id} (Admin only)
    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'Admin') {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        // Delete from Auth first
        $response = SupabaseAuthHelper::deleteUser($id);
        if ($response->failed()) {
            // Log warning but proceed to delete db record to keep database clean
            logger()->warning("Gagal hapus user di Supabase Auth: {$id}");
        }

        $user = User::find($id);
        if ($user) {
            $user->delete();
        }

        return response()->json(['success' => true, 'message' => 'Pengguna berhasil dihapus.']);
    }
}
