

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\PayablesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OtherPayableController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\ResourcesController;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/
// routes/api.php
// New enhanced dashboard endpoints
    Route::get('/dashboard/financial-data', [DashboardController::class, 'getFinancialData'])->middleware(['auth:api']);
    Route::middleware(['api'])->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware(['auth:api']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/transactions', [TransactionController::class, 'index'])->middleware(['auth:api']);
Route::get('/payables/filter', [PayablesController::class, 'filterDate']);
    // Your existing routes
    Route::post('/transactions', [TransactionController::class, 'store'])->middleware(['auth:api']);
    Route::post('/payables', [PayablesController::class, 'store'])->middleware(['auth:api']);
    Route::get('/payables', [PayablesController::class, 'index'])->middleware(['auth:api']);
    Route::get('payables/all', [PayablesController::class, 'getAllPayables']);
    Route::delete('/payables/{id}', [PayablesController::class, 'destroy']);
Route::get('/financial-report/monthly-data', [DashboardController::class, 'getMonthlyData'])->middleware(['auth:api']);
Route::post('payables/{id}/update-status', [PayablesController::class, 'updateStatus']);
Route::post('/other-payables', [OtherPayableController::class, 'store']);
Route::get('/otherpayables', [OtherPayableController::class, 'index']);
Route::get('user', [AuthController::class, 'userProfile']);
Route::get('users-list', [AuthController::class, 'index']);
// User routes
Route::put('/users/{user}', [AuthController::class, 'update']);
Route::delete('/users/{user}', [AuthController::class, 'destroy']);

Route::get('/budgets', [BudgetController::class, 'index']);
Route::post('/budgets', [BudgetController::class, 'store']);
Route::get('/budgets/{budget}', [BudgetController::class, 'show']);
Route::put('/budgets/{budget}', [BudgetController::class, 'update']);
Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy']);

// Add this route to your existing routes
Route::get('transactions/all', [TransactionController::class, 'getAllTransactions']);