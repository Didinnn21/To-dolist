<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index(Request $request)
    {
        $categories = Category::orderBy('name')->get();
        return response()->json(['categories' => $categories]);
    }

    // POST /api/categories
    public function store(Request $request)
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'Admin') {
            return response()->json(['error' => 'Akses ditolak. Hanya Admin yang diizinkan.'], 403);
        }

        $name = $request->input('name');
        if (!$name || !trim($name)) {
            return response()->json(['error' => 'Nama kategori wajib diisi.'], 400);
        }

        $category = Category::create([
            'id' => 'cat-' . time(),
            'name' => trim($name)
        ]);

        return response()->json(['category' => $category], 201);
    }

    // DELETE /api/categories/{id}
    public function destroy(Request $request, $id)
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'Admin') {
            return response()->json(['error' => 'Akses ditolak. Hanya Admin yang diizinkan.'], 403);
        }

        $category = Category::find($id);
        if ($category) {
            $category->delete();
        }

        return response()->json(['success' => true, 'message' => 'Kategori berhasil dihapus.']);
    }
}
