<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
class BudgetController extends Controller
{
    /**
     * Display a listing of budgets with their actual income/expenses.
     *  public function index(Request $request)
   
     */
    public function index(Request $request)
{
    // Get the timeframe from the request
    $timeframe = $request->get('timeframe', 'Monthly');

    // Base query to get all budgets
    $budgetsQuery = Budget::query();

    // Apply period_type filter based on timeframe
    if ($timeframe === 'Monthly') {
        $budgetsQuery->where('period_type', 'monthly');
    } elseif ($timeframe === 'Yearly') {
        $budgetsQuery->where('period_type', 'yearly');
    }

    // Eager load or transform budgets with their actual income and expenses
    $budgets = $budgetsQuery->get()->map(function ($budget) {
        // Since you have accessors in the Budget model, 
        // these will automatically trigger the calculations
        $actualIncome = $budget->actual_income;
        $actualExpenses = $budget->actual_expenses;

        // If you want to add these to the budget object explicitly
        $budget->setAttribute('actual_income', $actualIncome);
        $budget->setAttribute('actual_expenses', $actualExpenses);

        return $budget;
    });

    // Return the budgets as JSON
    return response()->json($budgets);
}
    /**
     * Store a newly created budget.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_type' => 'required|in:monthly,yearly',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12|required_if:period_type,monthly',
            'budgeted_income' => 'required|numeric|min:0',
            'budgeted_expenses' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id'
        ]);
        
        // Set user_id if not specified
        if (!isset($validated['user_id'])) {
            $validated['user_id'] = Auth::id();
        }
        
        // Set month to null for yearly budgets
        if ($validated['period_type'] === 'yearly') {
            $validated['month'] = null;
        }
        
        // Check for duplicates
        $exists = Budget::where('period_type', $validated['period_type'])
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->where('user_id', $validated['user_id'])
            ->exists();
            
        if ($exists) {
            return response()->json([
                'message' => 'A budget for this period already exists'
            ], 422);
        }
        
        $budget = Budget::create($validated);
        
        return response()->json($budget, 201);
    }

    /**
     * Display the specified budget.
     */
    public function show(Budget $budget)
    {
        // Authorize view
        $this->authorize('view', $budget);
        
        // Add actual data
        $actualData = DB::table('transactions')
            ->select(
                DB::raw('SUM(CASE WHEN type = "Income" THEN amount ELSE 0 END) as actual_income'),
                DB::raw('SUM(CASE WHEN type = "Expenses" THEN amount ELSE 0 END) as actual_expenses')
            )
            ->where('user_id', $budget->user_id)
            ->where(function ($query) use ($budget) {
                if ($budget->period_type === 'monthly') {
                    $query->whereYear('date', $budget->year)
                        ->whereMonth('date', $budget->month);
                } else {
                    $query->whereYear('date', $budget->year);
                }
            })
            ->first();
            
        // Add actual data to budget object
        $budget->actual_income = $actualData ? $actualData->actual_income : 0;
        $budget->actual_expenses = $actualData ? $actualData->actual_expenses : 0;
        
        return response()->json($budget->toArray());

    }

    /**
     * Update the specified budget.
     */
    public function update(Request $request, Budget $budget)
    {
        // Authorize update
        $this->authorize('update', $budget);
        
        $validated = $request->validate([
            'period_type' => 'required|in:monthly,yearly',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12|required_if:period_type,monthly',
            'budgeted_income' => 'required|numeric|min:0',
            'budgeted_expenses' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id'
        ]);
        
        // Set month to null for yearly budgets
        if ($validated['period_type'] === 'yearly') {
            $validated['month'] = null;
        }
        
        // Check for duplicates (excluding current record)
        $exists = Budget::where('period_type', $validated['period_type'])
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->where('user_id', $validated['user_id'] ?? Auth::id())
            ->where('id', '!=', $budget->id)
            ->exists();
            
        if ($exists) {
            return response()->json([
                'message' => 'A budget for this period already exists'
            ], 422);
        }
        
        $budget->update($validated);
        
        return response()->json($budget);
    }

    /**
     * Remove the specified budget.
     */
    public function destroy(Budget $budget)
    {
        // Authorize delete
        $this->authorize('delete', $budget);
        
        $budget->delete();
        
        return response()->json(null, 204);
    }
}