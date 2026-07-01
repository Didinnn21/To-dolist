<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('login');
});

Route::get('/user-dashboard', function () {
    return view('user-dashboard');
});

Route::get('/admin-dashboard', function () {
    return view('admin-dashboard');
});

Route::get('/tasks', function () {
    return view('tasks');
});

Route::get('/team', function () {
    return view('team');
});

Route::get('/profile', function () {
    return view('profile');
});

Route::get('/laporan', function () {
    return view('laporan');
});

Route::get('/laporan-honor', function () {
    return view('laporan-honor');
});

Route::get('/honor', function () {
    return view('honor');
});

Route::get('/archive', function () {
    return view('archive');
});

Route::get('/archive-paid', function () {
    return view('archive-paid');
});
