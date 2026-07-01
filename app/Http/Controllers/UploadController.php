<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private function getHeaders()
    {
        $key = env('SUPABASE_SERVICE_ROLE_KEY');
        return [
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
        ];
    }

    public function upload(Request $request)
    {
        if (!$request->hasFile('files')) {
            return response()->json(['error' => 'Tidak ada file yang diunggah.'], 400);
        }

        $files = $request->file('files');
        if (!is_array($files)) {
            $files = [$files];
        }

        $uploadedFiles = [];
        $errors = [];

        foreach ($files as $file) {
            $ext = strtolower($file->getClientOriginalExtension());
            $safeName = time() . '_' . Str::random(8) . '.' . $ext;
            $mimeType = $file->getMimeType();

            // POST binary body directly to Supabase Storage REST API
            $response = Http::withHeaders($this->getHeaders())
                ->withBody(file_get_contents($file->getRealPath()), $mimeType)
                ->post(env('SUPABASE_URL') . '/storage/v1/object/task_attachments/' . $safeName);

            if ($response->failed()) {
                $errors[] = ['name' => $file->getClientOriginalName(), 'error' => $response->body()];
                continue;
            }

            // Publicly accessible download link
            $publicUrl = env('SUPABASE_URL') . '/storage/v1/object/public/task_attachments/' . $safeName;

            $uploadedFiles[] = [
                'id' => 'att-' . time() . '-' . Str::random(6),
                'name' => $file->getClientOriginalName(),
                'url' => $publicUrl,
                'type' => $mimeType,
                'size' => $file->getSize()
            ];
        }

        if (empty($uploadedFiles) && !empty($errors)) {
            return response()->json([
                'error' => 'Semua file gagal diunggah.',
                'details' => $errors
            ], 500);
        }

        return response()->json([
            'success' => true,
            'uploaded' => $uploadedFiles,
            'errors' => !empty($errors) ? $errors : null
        ]);
    }

    public function destroy(Request $request)
    {
        $url = $request->input('url');
        if (!$url) {
            return response()->json(['error' => 'URL file wajib diisi.'], 400);
        }

        $parts = explode('/task_attachments/', $url);
        if (count($parts) < 2) {
            return response()->json(['error' => 'URL file tidak valid.'], 400);
        }
        $fileName = explode('?', $parts[1])[0];

        // DELETE from Supabase Storage REST API
        Http::withHeaders($this->getHeaders())
            ->delete(env('SUPABASE_URL') . '/storage/v1/object/task_attachments/' . $fileName);

        return response()->json(['success' => true]);
    }

    public function download(Request $request)
    {
        $url = $request->query('url');
        $name = $request->query('name');

        if (!$url) {
            return response()->json(['error' => 'URL file wajib disertakan.'], 400);
        }

        $parts = explode('/task_attachments/', $url);
        if (count($parts) < 2) {
            return response()->json(['error' => 'URL file tidak valid.'], 400);
        }
        $filePath = rawurldecode(explode('?', $parts[1])[0]);

        // Download raw file binary from Supabase Storage
        $response = Http::withHeaders($this->getHeaders())
            ->get(env('SUPABASE_URL') . '/storage/v1/object/task_attachments/' . $filePath);

        if ($response->failed()) {
            return response()->json(['error' => 'File tidak ditemukan di storage.'], 404);
        }

        $fileName = $name ?? basename($filePath);
        $contentType = $response->header('Content-Type') ?? 'application/octet-stream';

        return response($response->body(), 200)
            ->header('Content-Type', $contentType)
            ->header('Content-Disposition', 'attachment; filename="' . addslashes($fileName) . '"')
            ->header('Cache-Control', 'private, max-age=3600');
    }
}
