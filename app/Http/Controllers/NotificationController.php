<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    private function mapNotification($n)
    {
        return [
            'id' => $n->id,
            'userId' => $n->user_id,
            'message' => $n->message,
            'type' => $n->type,
            'timestamp' => $n->timestamp,
            'isRead' => (bool)$n->is_read
        ];
    }

    // GET /api/notifications
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $notifications = Notification::where('user_id', $currentUser->id)
            ->orderBy('timestamp', 'desc')
            ->limit(50)
            ->get();

        $mapped = $notifications->map(fn($n) => $this->mapNotification($n));
        return response()->json(['notifications' => $mapped]);
    }

    // POST /api/notifications
    public function store(Request $request)
    {
        $userId = $request->input('userId');
        $message = $request->input('message');
        $type = $request->input('type', 'info');

        if (!$userId || !$message) {
            return response()->json(['error' => 'userId dan message wajib diisi.'], 400);
        }

        $n = Notification::create([
            'id' => 'notif-' . time() . '-' . uniqid(),
            'user_id' => $userId,
            'message' => $message,
            'type' => $type,
            'timestamp' => now()->toIso8601String(),
            'is_read' => false
        ]);

        return response()->json(['notification' => $this->mapNotification($n)], 201);
    }

    // PUT /api/notifications/read-all
    public function readAll(Request $request)
    {
        $currentUser = $request->user();
        Notification::where('user_id', $currentUser->id)->update(['is_read' => true]);
        return response()->json(['success' => true, 'message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }

    // PUT /api/notifications/{id}/read
    public function read(Request $request, $id)
    {
        $currentUser = $request->user();
        $notif = Notification::where('id', $id)->where('user_id', $currentUser->id)->first();
        if ($notif) {
            $notif->update(['is_read' => true]);
        }
        return response()->json(['success' => true, 'message' => 'Notifikasi ditandai sudah dibaca.']);
    }
}
