<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'wf_notifications';

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'user_id',
        'message',
        'type',
        'timestamp',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}
