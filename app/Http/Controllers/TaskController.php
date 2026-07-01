<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    // Helper to parse assignees consistently
    private function parseAssignees($val)
    {
        if (!$val) return [];
        if (is_array($val)) return $val;
        if (is_string($val)) {
            try {
                $decoded = json_decode($val, true);
                return is_array($decoded) ? $decoded : [$val];
            } catch (\Exception $e) {
                return [$val];
            }
        }
        return [(string)$val];
    }

    // Helper to format/map a Task instance to match frontend keys
    private function mapTask($task)
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category,
            'deadline' => $task->deadline,
            'priority' => $task->priority,
            'assignedTo' => $this->parseAssignees($task->assigned_to),
            'createdBy' => $task->created_by,
            'status' => $task->status,
            'createdAt' => $task->created_at,
            'honorAmount' => (float)($task->honor_amount ?? 0),
            'attachments' => is_array($task->attachments) ? $task->attachments : [],
            'progressUpdates' => is_array($task->progress_updates) ? $task->progress_updates : []
        ];
    }

    // GET /api/tasks
    public function index(Request $request)
    {
        $tasks = Task::orderBy('created_at', 'desc')->get();
        $mappedTasks = $tasks->map(fn($t) => $this->mapTask($t));
        return response()->json(['tasks' => $mappedTasks]);
    }

    // POST /api/tasks
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'deadline' => 'required',
            'priority' => 'required|string',
        ]);

        $currentUser = $request->user();
        $assignedToInput = $request->input('assignedTo');
        $attachmentsInput = $request->input('attachments', []);

        $task = Task::create([
            'id' => 'task-' . time() . '-' . strtolower(Str::random(6)),
            'title' => $request->input('title'),
            'description' => $request->input('description', ''),
            'category' => $request->input('category', ''),
            'deadline' => $request->input('deadline'),
            'priority' => $request->input('priority'),
            'assigned_to' => $this->parseAssignees($assignedToInput),
            'created_by' => $currentUser->id,
            'status' => 'In Progress',
            'created_at' => now()->toIso8601String(),
            'attachments' => is_array($attachmentsInput) ? $attachmentsInput : [],
            'progress_updates' => []
        ]);

        return response()->json(['task' => $this->mapTask($task)], 201);
    }

    // PUT /api/tasks/{id}
    public function update(Request $request, $id)
    {
        $task = Task::find($id);
        if (!$task) {
            return response()->json(['error' => 'Tugas tidak ditemukan.'], 404);
        }

        $updateData = [];
        if ($request->has('title')) $updateData['title'] = $request->input('title');
        if ($request->has('description')) $updateData['description'] = $request->input('description');
        if ($request->has('category')) $updateData['category'] = $request->input('category');
        if ($request->has('deadline')) $updateData['deadline'] = $request->input('deadline');
        if ($request->has('priority')) $updateData['priority'] = $request->input('priority');
        if ($request->has('assignedTo')) $updateData['assigned_to'] = $this->parseAssignees($request->input('assignedTo'));
        if ($request->has('attachments')) $updateData['attachments'] = $request->input('attachments');

        $task->update($updateData);

        return response()->json(['task' => $this->mapTask($task)]);
    }

    // PUT /api/tasks/{id}/status
    public function updateStatus(Request $request, $id)
    {
        $status = $request->input('status');
        $validStatuses = ['Todo', 'In Progress', 'Completed', 'Paid'];

        if (!$status || !in_array($status, $validStatuses)) {
            return response()->json(['error' => 'Status tidak valid.'], 400);
        }

        $task = Task::find($id);
        if (!$task) {
            return response()->json(['error' => 'Tugas tidak ditemukan.'], 404);
        }

        $currentUser = $request->user();
        $isAdminOrPM = in_array($currentUser->role, ['Admin', 'Project Manager']);
        $currentStatus = $task->status;
        $assignees = $this->parseAssignees($task->assigned_to);
        $isAssignee = in_array($currentUser->id, $assignees);
        $isCompleted = in_array($currentStatus, ['Completed', 'Paid']);

        // RBAC logic validation:
        // 1. Reverting from Completed/Paid status -> Admin/PM only
        if ($isCompleted && !$isAdminOrPM) {
            return response()->json([
                'error' => 'Hanya Admin atau Project Manager yang dapat mengubah status tugas yang telah selesai.'
            ], 403);
        }

        // 2. Marking task as Completed -> assignee only
        if (!$isCompleted && $status === 'Completed' && !$isAssignee) {
            return response()->json([
                'error' => 'Hanya penanggungjawab tugas yang dapat menandai tugas sebagai selesai.'
            ], 403);
        }

        // 3. Marking task as Paid -> Admin/PM only
        if ($status === 'Paid' && !$isAdminOrPM) {
            return response()->json([
                'error' => 'Hanya Admin atau Project Manager yang dapat menandai tugas sebagai dibayar.'
            ], 403);
        }

        $task->update(['status' => $status]);

        return response()->json(['task' => $this->mapTask($task)]);
    }

    // POST /api/tasks/{id}/progress
    public function addProgress(Request $request, $id)
    {
        $text = $request->input('text');
        if (!$text || !trim($text)) {
            return response()->json(['error' => 'Teks progress update wajib diisi.'], 400);
        }

        $task = Task::find($id);
        if (!$task) {
            return response()->json(['error' => 'Tugas tidak ditemukan.'], 404);
        }

        $currentUser = $request->user();
        $progressUpdates = is_array($task->progress_updates) ? $task->progress_updates : [];

        $newUpdate = [
            'id' => 'upd-' . time(),
            'userId' => $currentUser->id,
            'userName' => $currentUser->name,
            'text' => trim($text),
            'createdAt' => now()->toIso8601String()
        ];
        $progressUpdates[] = $newUpdate;

        $task->update(['progress_updates' => $progressUpdates]);

        return response()->json(['progressUpdate' => $newUpdate], 201);
    }

    // DELETE /api/tasks/{id}/progress/{progressId}
    public function deleteProgress(Request $request, $id, $progressId)
    {
        $task = Task::find($id);
        if (!$task) {
            return response()->json(['error' => 'Tugas tidak ditemukan.'], 404);
        }

        $currentUser = $request->user();
        $progressUpdates = is_array($task->progress_updates) ? $task->progress_updates : [];

        $updateIndex = -1;
        foreach ($progressUpdates as $idx => $upd) {
            if ($upd['id'] === $progressId) {
                $updateIndex = $idx;
                break;
            }
        }

        if ($updateIndex === -1) {
            return response()->json(['error' => 'Progress update tidak ditemukan.'], 404);
        }

        $targetUpdate = $progressUpdates[$updateIndex];
        $isAdminOrPM = in_array($currentUser->role, ['Admin', 'Project Manager']);

        if ($targetUpdate['userId'] !== $currentUser->id && !$isAdminOrPM) {
            return response()->json(['error' => 'Akses ditolak. Anda tidak berhak menghapus progress ini.'], 403);
        }

        array_splice($progressUpdates, $updateIndex, 1);
        $task->update(['progress_updates' => $progressUpdates]);

        return response()->json(['success' => true, 'progressUpdates' => $progressUpdates]);
    }

    // DELETE /api/tasks/{id}
    public function destroy(Request $request, $id)
    {
        $task = Task::find($id);
        if (!$task) {
            return response()->json(['error' => 'Tugas tidak ditemukan.'], 404);
        }

        // Delete related comments/notifications if needed, then delete task
        $task->delete();

        return response()->json(['success' => true, 'message' => 'Tugas berhasil dihapus.']);
    }
}
