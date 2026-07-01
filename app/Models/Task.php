<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'wf_tasks';
    
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'title',
        'description',
        'category',
        'deadline',
        'priority',
        'assigned_to',
        'created_by',
        'status',
        'created_at',
        'attachments',
        'progress_updates',
        'honor_amount',
    ];

    protected $casts = [
        'assigned_to' => 'array',
        'attachments' => 'array',
        'progress_updates' => 'array',
        'honor_amount' => 'decimal:2',
    ];
}
