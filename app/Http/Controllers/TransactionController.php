<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function store(Request $request)
    {
        Log::info('Transaction store request received', ['request_data' => $request->all()]);

        $request->validate([
            'name' => [
                'required',
                'regex:/^[A-Za-z\s]+$/', // Only letters and spaces allowed
            ],
            'tags' => 'required|string|max:255',
            'company' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'type_of_payment' => 'required|string|max:255',
            'cost_or_income' => 'required|string|in:Expenses,Income',
            'expenses_category' => 'nullable|string',
            'date' => 'required|date',
            'description' => 'required|string',
            'receipt' => 'required|file|mimes:pdf,jpeg,jpg,png|max:5120' // 5MB max
        ]);

        try {
            // Handle file upload
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
            $receiptUrl = asset('storage/' . $receiptPath);

            // Create transaction record
            $transaction = Transaction::create([
                'name' => $request->name,
                'tags' => $request->tags,
                'company' => $request->company,
                'amount' => $request->amount,
                'type_of_payment' => $request->type_of_payment,
                'cost_or_income' => $request->cost_or_income,
                'description' => $request->description,
                'expenses_category'=> $request->expenses_category,
                'receipt' => $receiptUrl,
                'date' => $request->date 
            ]);

            // Update monthly totals
            $this->updateMonthlyTotals($transaction->date);

            Log::info('Transaction created successfully', ['transaction_id' => $transaction->id]);

            return response()->json([
                'message' => 'Transaction created successfully',
                'transaction' => $transaction
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating transaction', [
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);

            // Delete uploaded file if transaction creation fails
            if (isset($receiptPath)) {
                Storage::disk('public')->delete($receiptPath);
                Log::info('Uploaded receipt deleted due to transaction failure', ['receipt_path' => $receiptPath]);
            }

            return response()->json([
                'message' => 'Error creating transaction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function updateMonthlyTotals($date)
    {
        // Get the first and last day of the month for the given date
        $startOfMonth = date('Y-m-01', strtotime($date));
        $endOfMonth = date('Y-m-t', strtotime($date));

        // Calculate monthly totals
        $monthlyTotals = Transaction::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->select(
                DB::raw('SUM(CASE WHEN cost_or_income = "Income" THEN amount ELSE 0 END) as total_income'),
                DB::raw('SUM(CASE WHEN cost_or_income = "Expenses" THEN amount ELSE 0 END) as total_cost')
            )
            ->first();

        // Update all transactions in this month with the new totals
        Transaction::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->update([
                'total_income_month' => $monthlyTotals->total_income ?? 0,
                'total_cost_month' => $monthlyTotals->total_cost ?? 0
            ]);
    }

    public function index(Request $request)
    {
        $query = Transaction::query();

    if ($request->has('start_date') && $request->has('end_date')) {
        $query->whereBetween('date', [$request->start_date, $request->end_date]);
    }

    return response()->json($query->paginate(9));
    }

    public function getMonthlyTotals($year = null, $month = null)
    {
        if (!$year) {
            $year = date('Y');
        }
        if (!$month) {
            $month = date('m');
        }

        $startOfMonth = "{$year}-{$month}-01";
        $endOfMonth = date('Y-m-t', strtotime($startOfMonth));

        $totals = Transaction::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->select(
                DB::raw('SUM(CASE WHEN cost_or_income = "Income" THEN amount ELSE 0 END) as total_income'),
                DB::raw('SUM(CASE WHEN cost_or_income = "Expenses" THEN amount ELSE 0 END) as total_cost')
            )
            ->first();

        return response()->json([
            'year' => (int)$year,
            'month' => (int)$month,
            'total_income' => $totals->total_income ?? 0,
            'total_cost' => $totals->total_cost ?? 0,
            'net' => ($totals->total_income ?? 0) - ($totals->total_cost ?? 0)
        ]);
    }
    public function getAllTransactions(Request $request)
    {
        $query = Transaction::query();
    
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
    
        // Return all transactions without pagination
        return response()->json($query->get());
    }

   
}